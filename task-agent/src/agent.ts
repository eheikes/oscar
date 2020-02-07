import { getConfig } from './config'
import { sendEmail } from './email'
import { log } from './log'
import { compareTasks, Task } from './task'
import { getListCards } from './trello'

const FLAG_URGENT = 0x01
const FLAG_IMPORTANT = 0x10

;(async () => {
  log('main', 'Loading configuration')
  const config = await getConfig()

  // Retrieve all the cards from Trello.
  const cards = await getListCards(config.trello.lists, {
    numCards: config.trello.cardsPerList || 100
  })
  const tasks = cards.map(card => new Task(card))
  log('main', tasks.length, 'cards retrieved')

  // Sort the tasks into 4 buckets.
  let buckets: {[key: number]: Task[]} = {
    0: [],
    [FLAG_URGENT]: [],
    [FLAG_IMPORTANT]: [],
    [FLAG_URGENT | FLAG_IMPORTANT]: []
  }
  tasks.forEach(task => {
    let flags = 0
    if (task.important) {
      flags |= FLAG_IMPORTANT
    }
    if (task.urgent) {
      flags |= FLAG_URGENT
    }
    buckets[flags].push(task)
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
    buckets[0].slice(0, config.todos.numNotImportant)
  )
  log('main', `Email ${result.messageId} sent`)
})().catch(err => {
  log('main', 'Error!', err.stack)
})
