import { getConfig } from './config'
import { sendEmail } from './email'
import { log } from './log'
import { calculateTaskRank, compareTasks, Task } from './task'
import { getListCards, TrelloCard } from './trello'

const ONE_DAY = 1000 * 60 * 60 * 24
const ONE_WEEK = ONE_DAY * 7

const FLAG_URGENT = 0x01
const FLAG_IMPORTANT = 0x10

const convertCardToTask = (card: TrelloCard): Task => {
  const task: Task = {
    id: card.id,
    // see https://help.trello.com/article/759-getting-the-time-a-card-or-board-was-created
    dateCreated: new Date(parseInt(card.id.substring(0,8), 16) * 1000),
    dateLastActivity: new Date(card.dateLastActivity),
    dateDue: card.due ? new Date(card.due) : null,
    labels: card.labels.map(label => label.name.toLocaleLowerCase()),
    name: card.name,
    position: card.pos,
    url: card.shortUrl,
    rank: 0,
    important: false,
    urgent: false
  }
  task.important = task.labels.includes('important')
  task.urgent = Boolean(task.dateDue && (task.dateDue.valueOf() < Date.now() + ONE_WEEK))
  task.rank = calculateTaskRank(task)
  return task
}

(async () => {
  log('main', 'Loading configuration')
  const config = await getConfig()

  // Retrieve all the cards from Trello.
  const cards = await getListCards(config.trello.lists, {
    numCards: config.trello.cardsPerList || 100
  })
  const tasks = cards.map(convertCardToTask)
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
    buckets[FLAG_URGENT | FLAG_IMPORTANT].slice(0, 2),
    buckets[FLAG_URGENT].slice(0, 2),
    buckets[FLAG_IMPORTANT].slice(0, 2),
    buckets[0].slice(0, 1)
  )
  log('main', `Email ${result.messageId} sent`)
})().catch(err => {
  log('main', 'Error!', err.stack)
})
