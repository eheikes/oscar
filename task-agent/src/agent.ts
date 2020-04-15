import { getConfig } from './config'
import { sendEmail } from './email'
import { log } from './log'
import { compareTasks, Task } from './task'
import { CardSizePluginValue, TrelloCard, getCardPluginData, getCurrentUser, getListCards } from './trello'

export const FLAG_URGENT = 0x001
export const FLAG_IMPORTANT = 0x010
export const FLAG_OVERDUE = 0x100

type CardFilter = (c: TrelloCard) => boolean
type TaskFilter = (t: Task) => boolean

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
 * Chooses tasks until a size threshold is met.
 */
interface PickTasksOptions {
  pluginId?: string
  sizeUnit?: string
}
const pickTasks = async (tasks: Task[], sizeLimit: number, opts: PickTasksOptions): Promise<Task[]> => {
  let amountRemaining = sizeLimit
  let selectedTasks: Task[] = []
  for (let i = 0; amountRemaining > 0 && i < tasks.length; i++) {
    const allPluginData = await getCardPluginData(tasks[i].id)
    const pluginData = allPluginData.find(data => data.idPlugin === opts.pluginId)
    if (pluginData) {
      const data = JSON.parse(pluginData.value) as CardSizePluginValue
      if (data.size) {
        const cardAmountLeft = data.size - data.spent
        tasks[i].size = cardAmountLeft
        tasks[i].sizeReadable = `${cardAmountLeft}${opts.sizeUnit}`
        selectedTasks.push(tasks[i])
        amountRemaining -= cardAmountLeft
      } else {
        // Size field is missing, which shouldn't happen. Include the task as an unspecified amount.
        selectedTasks.push(tasks[i])
      }
    } else {
      // No card size data. Include the task as an unspecified amount.
      selectedTasks.push(tasks[i])
    }
  }
  return selectedTasks
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
    [FLAG_OVERDUE]: []
  }
  tasks.forEach(task => {
    if (task.urgent) {
      buckets[FLAG_URGENT].push(task)
    } else if (task.important) {
      buckets[FLAG_IMPORTANT].push(task)
    } else {
      buckets[0].push(task)
    }

    if (task.overdue) {
      buckets[FLAG_OVERDUE].push(task)
    }
  })
  buckets[FLAG_OVERDUE].sort(compareTasks)
  buckets[FLAG_URGENT].sort(compareTasks)
  buckets[FLAG_IMPORTANT].sort(compareTasks)
  buckets[0].sort(compareTasks)
  log('main', 'Urgent:', buckets[FLAG_URGENT].length, 'tasks')
  log('main', 'Important:', buckets[FLAG_IMPORTANT].length, 'tasks')
  log('main', 'Neither:', buckets[0].length, 'tasks')
  log('main', 'Overdue:', buckets[FLAG_OVERDUE].length, 'tasks')

  // Send an email with the selected tasks.
  const pickOpts: PickTasksOptions = {
    pluginId: config.trello.cardSizePluginId,
    sizeUnit: config.trello.cardSizeUnit
  }
  const urgent: Task[] = await pickTasks(buckets[FLAG_URGENT], config.todos.urgentAmount || 4, pickOpts)
  const important: Task[] = await pickTasks(buckets[FLAG_IMPORTANT], config.todos.importantAmount || 4, pickOpts)
  const overdue: Task[] = buckets[FLAG_OVERDUE].filter(isNotIn(urgent, important))
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
