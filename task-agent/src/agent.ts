import { getConfig } from './config'
import { sendEmail } from './email'
import { log } from './log'
import { compareTasks, Task } from './task'
import { getListCards } from './trello'

export const FLAG_URGENT = 0x001
export const FLAG_IMPORTANT = 0x010
export const FLAG_OVERDUE = 0x100

export const main = async (): Promise<void> => {
  log('main', 'Loading configuration')
  const config = await getConfig()

  // Retrieve all the cards from Trello.
  const cards = await getListCards(config.trello.lists, {
    /* eslint-disable-next-line @typescript-eslint/strict-boolean-expressions */
    numCards: config.trello.cardsPerList || 100
  })
  const tasks = cards.map(card => new Task(card, {
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
    [FLAG_OVERDUE]: [],
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

  // Send an email with the top tasks.
  const result = await sendEmail(
    buckets[FLAG_URGENT | FLAG_IMPORTANT].slice(0, config.todos.numUrgentImportant),
    buckets[FLAG_URGENT].slice(0, config.todos.numUrgent),
    buckets[FLAG_IMPORTANT].slice(0, config.todos.numImportant),
    buckets[0].slice(0, config.todos.numNotImportant),
    buckets[FLAG_OVERDUE | FLAG_IMPORTANT],
    buckets[FLAG_OVERDUE]
  )
  log('main', `Email ${result.messageId} sent`)
}

if (require.main === module) {
  main().catch(err => {
    log('main', 'Error!', err.stack)
  })
}
