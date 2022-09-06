import { firstFit }  from 'bin-packer'
import { Config } from './config'
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

export interface CardCandidate extends Pick<TrelloCard, 'id' | 'labels' | 'name'> {
  due: Date
  /** Size for this slice of time */
  size: number
  /** Overall size of the task */
  totalSize: number
}

export interface ChooserOptions {
  dryRun?: boolean
}

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
    return {
      id: card.id,
      due: new Date(card.due || (creationTime.valueOf() + defaultDeadline)),
      labels: card.labels,
      name: card.name,
      size: oversized ? maxSize : cardSize,
      totalSize: cardSize
    }
  })
  cardPool.sort(sortByDueDate) // models the priority
  log('choose', cardPool.length, 'card candidates found')

  // Choose tasks for the upcoming week using a bin-packing algorithm.
  const importantTasks = firstFit(
    cardPool.filter(card =>
      hasLabelName(card, importantLabelName)
      || (!hasLabelName(card, unimportantLabelName) && defaultLabel === Importance.Important)
    ),
    (card) => card.size,
    importantCapacity
  ).bins
  const unimportantTasks = firstFit(
    cardPool.filter(card =>
      hasLabelName(card, unimportantLabelName)
      || (!hasLabelName(card, importantLabelName) && defaultLabel === Importance.NotImportant)
    ),
    (card) => card.size,
    unimportantCapacity
  ).bins

  const todaysImportantTasks = importantTasks[0]
  const todaysUnimportantTasks = unimportantTasks[0]
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
      await renameCard(card.id, newName)
    }
    await moveCardToList(card.id, destinationBoardId, destinationListId)
  }
}
