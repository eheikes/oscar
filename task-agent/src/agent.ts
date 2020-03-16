import { getConfig } from './config'
import { sendEmail } from './email'
import { log } from './log'
import { compareTasks, Task } from './task'
import { TrelloCard, getCurrentUser, getListCards } from './trello'

export const FLAG_URGENT = 0x001
export const FLAG_IMPORTANT = 0x010
export const FLAG_OVERDUE = 0x100

type CardFilter = (c: TrelloCard) => boolean
type TaskFilter = (t: Task) => boolean

/**
 * Returns a filtering function to only include cards that:
 *   1) have no one assigned to them, or
 *   2) have the specified user assigned to them
 */
const isUserCard = (userId: string): CardFilter => {
  return (card: TrelloCard) =>
    card.idMembers.length === 0 ||
    card.idMembers.includes(userId)
}

/**
 * Returns a filtering function to check if a task is not in a collection (or collections) of tasks.
 */
const isNotIn = (...args: Task[][]): TaskFilter => {
  return (task: Task) => {
    for (const tasks of args) {
      if (tasks.some(t => t.id === task.id)) {
        return false
      }
    }
    return true
  }
}

export const main = async (): Promise<void> => {
  log('main', 'Loading configuration')
  const config = await getConfig()

  // Retrieve the user info from Trello.
  const { id: userId } = await getCurrentUser()
  log('main', 'Current user is', userId)

  // Retrieve all the cards from Trello.
  const cards = await getListCards(config.trello.lists, {
    /* eslint-disable-next-line @typescript-eslint/strict-boolean-expressions */
    numCards: config.trello.cardsPerList || 100
  })
  const tasks = cards.filter(isUserCard(userId)).map(card => new Task(card, {
    defaultTimeDue: config.todos.defaultDue,
    importantLabel: config.trello.labels.important,
    unimportantLabel: config.trello.labels.unimportant,
    urgentTime: config.todos.urgentTime
  }))
  log('main', tasks.length, 'cards retrieved')

  // Sort the tasks into buckets.
  const buckets: {[key: number]: Task[]} = {
    0: [],
    [FLAG_URGENT]: [],
    [FLAG_IMPORTANT]: [],
    [FLAG_URGENT | FLAG_IMPORTANT]: [],
    [FLAG_OVERDUE | FLAG_IMPORTANT]: [],
    [FLAG_OVERDUE]: []
  }
  const now = new Date()
  tasks.forEach(task => {
    let flags = 0
    if (task.important) {
      flags |= FLAG_IMPORTANT
    }
    if (task.urgent) {
      flags |= FLAG_URGENT
    }
    buckets[flags].push(task)
    if (task.dateDue.valueOf() <= now.valueOf()) {
      buckets[FLAG_OVERDUE | (task.important ? FLAG_IMPORTANT : 0)].push(task)
    }
  })
  buckets[FLAG_URGENT | FLAG_IMPORTANT].sort(compareTasks)
  buckets[FLAG_URGENT].sort(compareTasks)
  buckets[FLAG_IMPORTANT].sort(compareTasks)
  buckets[0].sort(compareTasks)
  log('main', 'Urgent + Important:', buckets[FLAG_URGENT | FLAG_IMPORTANT].length, 'tasks')
  log('main', 'Urgent:', buckets[FLAG_URGENT].length, 'tasks')
  log('main', 'Important:', buckets[FLAG_IMPORTANT].length, 'tasks')
  log('main', 'Neither:', buckets[0].length, 'tasks')
  log('main', 'Overdue + Important:', buckets[FLAG_OVERDUE | FLAG_IMPORTANT].length, 'tasks')
  log('main', 'Overdue:', buckets[FLAG_OVERDUE].length, 'tasks')

  // Send an email with the top tasks.
  const urgent: Task[] = []
  const important: Task[] = []
  const overdue: Task[] = []
  urgent.push(...buckets[FLAG_URGENT | FLAG_IMPORTANT].slice(0, config.todos.numUrgentImportant))
  urgent.push(...buckets[FLAG_URGENT].slice(0, config.todos.numUrgent))
  important.push(...buckets[FLAG_IMPORTANT].slice(0, config.todos.numImportant))
  important.push(...buckets[0].slice(0, config.todos.numNotImportant))
  overdue.push(...buckets[FLAG_OVERDUE | FLAG_IMPORTANT].filter(isNotIn(urgent, important)))
  overdue.push(...buckets[FLAG_OVERDUE].filter(isNotIn(urgent, important)))
  const result = await sendEmail(
    urgent,
    important,
    overdue
  )
  log('main', `Email ${result.messageId} sent`)
}

if (require.main === module) {
  main().catch(err => {
    log('main', 'Error!', err.stack)
  })
}
