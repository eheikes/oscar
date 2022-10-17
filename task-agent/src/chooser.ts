import { firstFit }  from 'bin-packer'
import { Config } from './config'
import { sendOverdueEmail } from './email'
import { log } from './log'
import { Importance } from './task'
import {
  getCardCreationTime,
  getCurrentUser,
  getListCards,
  isUserCard,
  moveCardToList,
  renameCard,
  TrelloCard
} from './trello'

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export interface CardCandidate extends Pick<TrelloCard, 'id' | 'labels' | 'name' | 'url'> {
  due: Date
  /** Size for this slice of time */
  size: number
  /** Overall size of the task */
  totalSize: number
}

export interface ChooserOptions {
  'dry-run'?: boolean
}

const DAY_IN_MS = 60 * 60 * 24 * 1000 // num of millisecs in 24 hrs
const cardSizeRegExp = /\(([0-9.]+)\)(\s*)$/

/**
 * for debugging
 */
const getFormattedTasks = (cards: CardCandidate[] | CardCandidate[][]): string => {
  let str = ''
  // Check if it's an array of arrays
  if (cards[0] && Array.isArray(cards[0])) {
    for (const cardsSubArray of cards as CardCandidate[][]) {
      str += getFormattedTasks(cardsSubArray) + '\n'
    }
  } else {
    for (const card of cards as CardCandidate[]) {
      const labels = card.labels || []
      str += `  ${card.name}  ${card.due}  ${labels.map(labelInfo => labelInfo.name).join(',')}\n`
    }
  }
  return str
}

const getDayOfWeek = (): DayOfWeek => {
  const dowNumber = new Date().getDay()
  if (dowNumber === 0) { return 'sun' }
  if (dowNumber === 1) { return 'mon' }
  if (dowNumber === 2) { return 'tue' }
  if (dowNumber === 3) { return 'wed' }
  if (dowNumber === 4) { return 'thu' }
  if (dowNumber === 5) { return 'fri' }
  if (dowNumber === 6) { return 'sat' }
  throw new RangeError('Day of week should have been 0-6 value')
}

/**
 * Get capacity for the specified label, for the current DoW.
 */
const getCapacity = (config: Config, type: Importance): number => {
  const dow = getDayOfWeek()
  const budgets = config?.chooser?.budgets
  const todayBudgets = budgets && budgets[dow]
  return (todayBudgets && todayBudgets[type]) || 1
}

const getCardSize = (card: TrelloCard): number | null => {
  const matches = card.name.match(cardSizeRegExp)
  return matches ? parseFloat(matches[1]) : null
}

/**
 * Return the default amount of time for the deadline, in ms.
 */
const getDefaultDeadline = (config: Config): number => {
  const configuredDefault = config?.chooser?.defaults?.deadline
  if (!configuredDefault || configuredDefault === 'ignore') { return 60 * 60 * 24 * 7 * 1000 }
  return configuredDefault * 1000
}

const getDefaultLabel = (config: Config): Importance => {
  const configuredDefault = config?.chooser?.defaults?.label
  if (!configuredDefault || configuredDefault === 'ignore') { return Importance.NotImportant }
  return configuredDefault
}

const getDefaultSize = (config: Config): number => {
  const configuredDefault = config?.chooser?.defaults?.size
  if (!configuredDefault || configuredDefault === 'ignore') { return 1 }
  return configuredDefault
}

const getImportantLabel = (config: Config): string => {
  return config?.chooser?.labels?.important || 'important'
}

const getUnimportantLabel = (config: Config): string => {
  return config?.chooser?.labels?.unimportant || 'unimportant'
}

const hasLabelName = (card: TrelloCard | CardCandidate, name: string): boolean => {
  return card.labels.some(labelInfo => labelInfo.name === name)
}

/**
 * Sorts in chronological order by due date.
 */
const sortByDueDate = (a: CardCandidate, b: CardCandidate): -1 | 0 | 1 => {
  if (a.due === b.due) { return 0 }
  return a.due > b.due ? 1 : -1
}

export const choose = async (config: Config, opts: ChooserOptions = {}) => {
  const dryRun = opts['dry-run'] || false
  if (dryRun) {
    log('choose', '------------------ DRY RUN ------------------')
  }

  const importantLabelName = getImportantLabel(config)
  const unimportantLabelName = getUnimportantLabel(config)
  const importantCapacity = getCapacity(config, Importance.Important)
  const unimportantCapacity = getCapacity(config, Importance.NotImportant)
  const defaultDeadline =  getDefaultDeadline(config)
  const defaultLabel =  getDefaultLabel(config)
  const defaultSize =  getDefaultSize(config)
  const maxSize = Math.min(importantCapacity, unimportantCapacity)

  // Retrieve the user info from Trello.
  const { id: userId } = await getCurrentUser()
  log('choose', 'Current user is', userId)

  // Retrieve all the cards from Trello.
  if (!config?.chooser?.sources) { return }
  const cards = await getListCards(config.chooser.sources, {
    /* eslint-disable-next-line @typescript-eslint/strict-boolean-expressions */
    numCards: config.trello.cardsPerList || 100
  })

  // Build the pool of card candidates.
  const cardPool: CardCandidate[] = cards.filter(card => {
    if (!isUserCard(userId)) {
      log('choose', `Card "${card.name}" is assigned to someone else, ignoring`)
      return false
    }
    if (getCardSize(card) === null && config?.chooser?.defaults?.size === 'ignore') {
      log('choose', `Card "${card.name}" does not have a size, ignoring`)
      return false
    }
    if (
      !hasLabelName(card, importantLabelName)
      && !hasLabelName(card, unimportantLabelName)
      && config?.chooser?.defaults?.label === 'ignore'
    ) {
      log('choose', `Card "${card.name}" does not have a label, ignoring`)
      return false
    }
    if (!card.due && config?.chooser?.defaults?.label === 'ignore') {
      log('choose', `Card "${card.name}" does not have a due date, ignoring`)
      return false
    }
    return true
  }).map(card => {
    const creationTime = getCardCreationTime(card)
    const cardSize = getCardSize(card) || defaultSize
    const oversized = cardSize > maxSize
    const sizeForNow = oversized ? maxSize : cardSize // amount to work on in current slice
    const effectiveCardSize = Math.max(cardSize, maxSize) // round up small sizes to a time slice size
    const effectiveSizeForNow = Math.max(sizeForNow, maxSize) // round up small sizes to a time slice size
    const effectiveDayOffset = (effectiveCardSize / effectiveSizeForNow - 1)
    const deadline = new Date(card.due || (creationTime.valueOf() + defaultDeadline))
    const shiftedDeadline = new Date(deadline.valueOf() - effectiveDayOffset * DAY_IN_MS) // shift large tasks to be earlier
    if (shiftedDeadline.valueOf() !== deadline.valueOf()) {
      log('choose', `Card "${card.name} is large, making the effective deadline ${shiftedDeadline}`)
    }
    return {
      id: card.id,
      due: shiftedDeadline,
      labels: card.labels,
      name: card.name,
      size: sizeForNow,
      totalSize: cardSize,
      url: card.url
    }
  })
  cardPool.sort(sortByDueDate) // models the priority
  log('choose', cardPool.length, 'card candidates found')
  log('choose', 'All tasks:\n' + getFormattedTasks(cardPool))

  // Choose tasks for the upcoming week using a bin-packing algorithm.
  log('choose', 'Important capacity is', importantCapacity)
  const importantTasks = firstFit(
    cardPool.filter(card =>
      hasLabelName(card, importantLabelName)
      || (!hasLabelName(card, unimportantLabelName) && defaultLabel === Importance.Important)
    ),
    (card) => card.size,
    importantCapacity
  ).bins
  log('choose', 'Important tasks: \n' + getFormattedTasks(importantTasks))
  log('choose', 'Unimportant capacity is', unimportantCapacity)
  const unimportantTasks = firstFit(
    cardPool.filter(card =>
      hasLabelName(card, unimportantLabelName)
      || (!hasLabelName(card, importantLabelName) && defaultLabel === Importance.NotImportant)
    ),
    (card) => card.size,
    unimportantCapacity
  ).bins
  log('choose', 'Unimportant tasks: \n' + getFormattedTasks(unimportantTasks))

  const [ todaysImportantTasks, ...futureImportantTasks ] = importantTasks
  const [ todaysUnimportantTasks, ...futureUnimportantTasks ] = unimportantTasks

  // Move today's cards into the destination list.
  const destinationBoardId = config?.chooser?.destination?.board
  const destinationListId = config?.chooser?.destination?.list
  if (!destinationBoardId) {
    throw new Error('A destination board ID must be specified in the configuration')
  }
  if (!destinationListId) {
    throw new Error('A destination list ID must be specified in the configuration')
  }
  for (const card of [ ...todaysImportantTasks, ...todaysUnimportantTasks ]) {
    log('choose', `Selecting card "${card.name}"`)
    if (card.size !== card.totalSize) {
      const newName = card.name.replace(cardSizeRegExp, `($1, today do ${card.size})$2`)
      if (!dryRun) {
        await renameCard(card.id, newName)
      }
    }
    if (!dryRun) {
      await moveCardToList(card.id, destinationBoardId, destinationListId)
    }
  }

  // Warn about cards that won't meet the deadline.
  const overdueCards = [ ...futureImportantTasks, ...futureUnimportantTasks ].flat().filter(card => {
    return new Date(card.due).valueOf() < Date.now()
  })
  for (const card of overdueCards) {
    log('choose', `Warning: ${card.name} will not be completed by due date!`)
  }
  if (config.chooser.sendOverdueEmail) {
    log('choose', 'Sending email of overdue tasks')
    if (!dryRun) {
      sendOverdueEmail(overdueCards)
    }
  }
}
