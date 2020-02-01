import PriorityQueue = require('js-priority-queue')
import { getConfig } from './config'
import { log } from './log'
import { calculateTaskRank, compareTasks, Task } from './task'
import { getListCards, TrelloCard } from './trello'

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
    rank: 0
  }
  task.rank = calculateTaskRank(task)
  return task
}

(async () => {
  log('main', 'Loading configuration')
  const config = await getConfig()

  const cards = await getListCards(config.trello.lists, {
    numCards: config.trello.cardsPerList || 100
  })

  const tasks = cards.map(convertCardToTask)
  log('main', tasks.length, 'cards retrieved')
  const queue = new PriorityQueue<Task>({
    initialValues: tasks,
    comparator: compareTasks
  })
  log('main', queue.length, 'tasks added to queue')

  while (queue.length > 0) {
    const task = queue.dequeue()
    const name = task.name.substring(0, 50).padStart(52, ' ')
    log('main', name, task.rank)
  }

  // TODO
  // Allocate cards to the day
  // Drop any cards that are unimportant and not urgent
  // Send email with calendar links/ICS and digest
  // Warn about missed deadlines etc
})().catch(err => {
  log('main', 'Error!', err)
})
