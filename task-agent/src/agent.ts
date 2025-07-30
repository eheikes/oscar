import { promises as fs } from 'fs'
import { compile, registerHelper } from 'handlebars'
import * as minimist from 'minimist'
import { basename, join } from 'path'
import { Config, getConfig, RecurringConfig } from './config'
import { choose, ChooserOptions } from './chooser'
import { sendTodoEmail } from './email'
import { log } from './log'
import { Task } from './task'
import {
  addLabel,
  addTask,
  assignPerson,
  deleteTask,
  getCurrentUser as getTeamGanttUser,
  getOldTasks,
  getProjectGroups,
  getProjects,
  getTodaysTasks,
  getUnassignedTasks,
  Task as TeamGanttTask
} from './teamgantt'
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
 * Returns true if the configured todo should occur today.
 */
const shouldOccur = (todo: RecurringConfig): boolean => {
  const now = new Date()
  if (todo.type === 'dow') {
    if (todo.value === '*') { return true }
    return now.getDay() === Number(todo.value)
  } else if (todo.type === 'date') {
    if (typeof todo.value === 'number') {
      return now.getDate() === todo.value
    } else if (todo.value === '*') {
      return true
    } else if (todo.value === 'even') {
      return now.getDate() % 2 === 0
    } else if (todo.value === 'odd') {
      return now.getDate() % 2 === 1
    } else {
      throw new Error(`Unrecognized value "${todo.value}" for recurring "date" type`)
    }
  } else {
    throw new Error(`Unsupported recurring type of "${todo.type}`)
  }
}

const sleep = (millisecs: number) => new Promise((resolve) => setTimeout(resolve, millisecs))

/**
 * Chooses tasks until a size threshold is met.
 */
interface PickTasksOptions {
  pluginId?: string
  sizeUnit?: string
}
const pickTasks = async (tasks: Task[], sizeLimit: number, opts: PickTasksOptions): Promise<Task[]> => {
  let amountRemaining = sizeLimit
  const selectedTasks: Task[] = []
  for (let i = 0; amountRemaining > 0 && i < tasks.length; i++) {
    const allPluginData = await getCardPluginData(tasks[i].id)
    const pluginData = allPluginData.find(data => data.idPlugin === opts.pluginId)
    if (pluginData) {
      const data = JSON.parse(pluginData.value) as CardSizePluginValue
      if (typeof data.size !== 'undefined') {
        let cardAmountLeft = data.size - data.spent
        if (cardAmountLeft < 0) {
          log('pickTasks', `Warning: The size of task "${tasks[i].name}" is less than the amount of time spent on it`)
          cardAmountLeft = 0
        }
        const amountToDo = Math.min(cardAmountLeft, amountRemaining) // either finish the card, or use up remaining time
        tasks[i].size = amountToDo
        tasks[i].sizeReadable = `${amountToDo}${opts.sizeUnit ?? 'hr'}`
        selectedTasks.push(tasks[i])
        amountRemaining -= amountToDo
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

/**
 * Creates recurring tasks for the current day in TeamGantt.
 */
export const create = async (config: Config): Promise<void> => {
  if (!config.todos.recurring) {
    log('create', 'No recurring todos are configured')
    return
  }
  log('create', 'Found', (config.todos.recurring || []).length, 'recurring todos')
  const now = new Date()
  for (const recurringTodo of (config.todos.recurring || [])) {
    if (shouldOccur(recurringTodo)) {
      log('create', `Creating task for "${recurringTodo.name}"`)
      const timeParts = (recurringTodo.due ?? '23:59').split(':')
      const hour = parseInt(timeParts[0], 10)
      const minute = parseInt(timeParts[1], 10)
      const dueDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hour,
        minute,
        0
      )
      const task = await addTask({
        name: recurringTodo.name,
        desc: recurringTodo.description,
        due: dueDate,
        projectId: recurringTodo.projectId,
        groupId: recurringTodo.groupId
      })
      if (recurringTodo.assignee) {
        await assignPerson(task.id, recurringTodo.assignee)
      }
      for (const label of recurringTodo.labels || []) {
        await addLabel(task.id, label)
      }
    }
  }
}

export const list = async (config: Config): Promise<void> => {
  let tasks = await getUnassignedTasks()
  tasks = tasks.filter(task => task.start_date)
  console.log('tasks:', tasks)
  const sortedTasks: {[key: string]: TeamGanttTask[]} = {}
  for (const task of tasks) {
    if (!(task.parent_group_name in sortedTasks)) {
      sortedTasks[task.parent_group_name] = []
    }
    sortedTasks[task.parent_group_name].push(task)
    sortedTasks[task.parent_group_name].sort((a, b) => { return b.sort - a.sort })
  }
  for (const group of Object.keys(sortedTasks)) {
    console.log(`${group}:`, sortedTasks[group].map(task => task.name).join(', '))
    // console.log(`${group} oldest:`, sortedTasks[group].slice(0, 3).map(task => task.name).join(', '))
    // console.log(`${group} newest:`, sortedTasks[group].slice(-3).map(task => task.name).join(', '))
  }
}

export const purge = async (config: Config): Promise<void> => {
  let tasks = await getOldTasks()
  for (const task of tasks) {
    console.log(`Deleting task ${task.id}: ${task.name} (${task.start_date} to ${task.end_date})`)
    await deleteTask(task.id)
    // await sleep(200) // slow enough that no waiting is necessary
  }
}

/**
 * Sends an email of the to-do list.
 */
export const email = async (config: Config): Promise<void> => {
  // Retrieve the user info from Trello.
  const { id: userId } = await getCurrentUser()
  log('email', 'Current user is', userId)

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
  log('email', tasks.length, 'cards retrieved')

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
  buckets[FLAG_OVERDUE].sort(Task.compare)
  buckets[FLAG_URGENT].sort(Task.compare)
  buckets[FLAG_IMPORTANT].sort(Task.compare)
  buckets[0].sort(Task.compare)
  log('email', 'Urgent:', buckets[FLAG_URGENT].length, 'tasks')
  log('email', 'Important:', buckets[FLAG_IMPORTANT].length, 'tasks')
  log('email', 'Neither:', buckets[0].length, 'tasks')
  log('email', 'Overdue:', buckets[FLAG_OVERDUE].length, 'tasks')

  // Send an email with the selected tasks.
  const pickOpts: PickTasksOptions = {
    pluginId: config.trello.cardSizePluginId,
    sizeUnit: config.trello.cardSizeUnit
  }
  const urgent: Task[] = await pickTasks(buckets[FLAG_URGENT], config.todos.urgentAmount || 4, pickOpts)
  const important: Task[] = await pickTasks(buckets[FLAG_IMPORTANT], config.todos.importantAmount || 4, pickOpts)
  const overdue: Task[] = buckets[FLAG_OVERDUE].filter(isNotIn(urgent, important))
  const result = await sendTodoEmail(
    urgent,
    important,
    overdue
  )
  log('email', `Email ${result.messageId} sent`)
}

/**
 * Creates a webpage of the to-do list.
 */
export const html = async (config: Config): Promise<void> => {
  // Retrieve the tasks from TeamGantt.
  const tasks = await getTodaysTasks()
  // const tasks = cards.filter(isUserCard(userId)).map(card => new Task(card, {
  //   defaultTimeDue: config.todos.defaultDue,
  //   importantLabel: config.trello.labels.important,
  //   unimportantLabel: config.trello.labels.unimportant,
  //   urgentTime: config.todos.urgentTime
  // }))
  log('html', tasks.length, 'tasks retrieved')

  // Filter and modify the tasks.
  const excludedProjects = config.html.excludeProjects || []
  const modifiedTasks = tasks.filter((task) => {
    // Omit any tasks that are in a project marked for exclusion.
    return !excludedProjects.includes(task.project_id)
  }).map((task) => {
    return {
      ...task,
      is_overdue: task.work_days_left < 0
    }
  })
  log('html', modifiedTasks.length, 'tasks to do')

  // Sort the tasks into buckets.
  // const buckets: {[key: number]: Task[]} = {
  //   0: [],
  //   [FLAG_URGENT]: [],
  //   [FLAG_IMPORTANT]: [],
  //   [FLAG_OVERDUE]: []
  // }
  // tasks.forEach(task => {
  //   if (task.urgent) {
  //     buckets[FLAG_URGENT].push(task)
  //   } else if (task.important) {
  //     buckets[FLAG_IMPORTANT].push(task)
  //   } else {
  //     buckets[0].push(task)
  //   }

  //   if (task.overdue) {
  //     buckets[FLAG_OVERDUE].push(task)
  //   }
  // })
  // buckets[FLAG_OVERDUE].sort(Task.compare)
  // buckets[FLAG_URGENT].sort(Task.compare)
  // buckets[FLAG_IMPORTANT].sort(Task.compare)
  // buckets[0].sort(Task.compare)
  // log('email', 'Urgent:', buckets[FLAG_URGENT].length, 'tasks')
  // log('email', 'Important:', buckets[FLAG_IMPORTANT].length, 'tasks')
  // log('email', 'Neither:', buckets[0].length, 'tasks')
  // log('email', 'Overdue:', buckets[FLAG_OVERDUE].length, 'tasks')

  // Send an email with the selected tasks.
  // const pickOpts: PickTasksOptions = {
  //   pluginId: config.trello.cardSizePluginId,
  //   sizeUnit: config.trello.cardSizeUnit
  // }
  // const urgent: Task[] = await pickTasks(buckets[FLAG_URGENT], config.todos.urgentAmount || 4, pickOpts)
  // const important: Task[] = await pickTasks(buckets[FLAG_IMPORTANT], config.todos.importantAmount || 4, pickOpts)
  // const overdue: Task[] = buckets[FLAG_OVERDUE].filter(isNotIn(urgent, important))
  // const result = await sendTodoEmail(
  //   urgent,
  //   important,
  //   overdue
  // )
  // log('email', `Email ${result.messageId} sent`)

  // Build the HTML.
  // registerHelper('date', toDateString)
  const templateFilename = join(__dirname, '..', 'templates', 'todo.html')
  const template = await fs.readFile(templateFilename, 'utf-8')
  const compiled = compile(template)
  const html = compiled({ tasks: modifiedTasks })

  // Write the file.
  await fs.writeFile(config.html.outputFile, html, 'utf-8')
  log('html', `Wrote HTML to ${config.html.outputFile}`)
}

export const usage = (): void => {
  process.stdout.write(`Usage: ${basename(process.argv[1])} {choose | create | email | sort} [--dry-run]
`)
}

export const main = async (): Promise<void> => {
  log('main', 'Loading configuration')
  const config = await getConfig()

  const argv = minimist<ChooserOptions>(process.argv.slice(2), {
    boolean: ['dry-run']
  })
  if (argv._[0] === 'choose') {
    await choose(config, argv)
  } else if (argv._[0] === 'create') {
    await create(config)
  } else if (argv._[0] === 'email') {
    await email(config)
  } else if (argv._[0] === 'purge') {
    await purge(config)
  } else if (argv._[0] === 'html') {
    await html(config)
  } else if (argv._[0] === 'list') {
    await list(config)
  } else {
    usage()
    return
  }
}

if (require.main === module) {
  main().catch(err => {
    log('main', 'Error!', err.stack)
  })
}
