import { TrelloCard } from './trello'

export enum Importance {
  Important = 'important',
  NotImportant = 'unimportant'
}

interface TaskOptions {
  defaultTimeDue: number // in seconds
  importantLabel: string
  unimportantLabel: string
  urgentTime: number // in seconds
}

const defaultOpts: TaskOptions = {
  defaultTimeDue: 1209600,
  importantLabel: Importance.Important,
  unimportantLabel: Importance.NotImportant,
  urgentTime: 604800
}

const ageOf = (task: Task): number => {
  return Date.now() - task.dateCreated.valueOf()
}

const importanceOf = (task: Task): number => {
  if (task.labels.includes(Importance.Important)) { return 10 }
  if (task.labels.includes(Importance.NotImportant)) { return 2 }
  return 5
}

export class Task {
  id: string
  dateCreated: Date
  dateLastActivity: Date
  dateDue: Date
  labels: string[]
  name: string
  position: number
  url: string
  urgent: boolean
  important: boolean
  overdue: boolean
  size?: number
  sizeReadable?: string

  constructor (card: TrelloCard, opts: TaskOptions = defaultOpts) {
    this.id = card.id
    // see https://help.trello.com/article/759-getting-the-time-a-card-or-board-was-created
    this.dateCreated = new Date(parseInt(card.id.substring(0, 8), 16) * 1000)
    this.dateLastActivity = new Date(card.dateLastActivity)
    // If the task has no due date, assume one.
    /* eslint-disable-next-line @typescript-eslint/strict-boolean-expressions */
    this.dateDue = card.due ? new Date(card.due) : new Date(Date.now() + opts.defaultTimeDue * 1000)
    this.labels = card.labels.map(label => label.name.toLocaleLowerCase())
    this.name = card.name
    this.position = card.pos
    this.url = card.shortUrl
    this.important = this.labels.includes(opts.importantLabel)
    this.urgent = Boolean(this.dateDue.valueOf() < Date.now() + opts.urgentTime * 1000)
    this.overdue = this.dateDue.valueOf() < Date.now()
  }

  static compare (a: Task, b: Task): number {
    // A function call is used to make testing easier (lazy evaluation).
    const comparators: Array<() => [number, number]> = [
      // In order from most significant factor to least.
      // If a smaller number should rank higher, put "a" first.
      // If a larger number should rank higher, put "b" first.
      () => [a.dateDue.valueOf(), b.dateDue.valueOf()],
      () => [importanceOf(b), importanceOf(a)],
      () => [b.size ?? 0, a.size ?? 0],
      () => [ageOf(b), ageOf(a)],
      () => [a.dateLastActivity.valueOf(), b.dateLastActivity.valueOf()],
      () => [a.position, b.position]
    ]
    for (const comparator of comparators) {
      const [x, y] = comparator()
      if (x !== y) { return x - y }
    }
    return 0
  }
}
