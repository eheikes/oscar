import { TrelloCard } from './trello'

const ONE_DAY = 1000 * 60 * 60 * 24
const ONE_YEAR = ONE_DAY * 365

interface TaskOptions {
  defaultTimeDue: number // in seconds
  importantLabel: string
  unimportantLabel: string
  urgentTime: number // in seconds
}

const defaultOpts: TaskOptions = {
  defaultTimeDue: 1209600,
  importantLabel: 'important',
  unimportantLabel: 'not important',
  urgentTime: 604800
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
  rank: number
  urgent: boolean
  important: boolean

  constructor(card: TrelloCard, opts: TaskOptions = defaultOpts) {
    this.id = card.id
    // see https://help.trello.com/article/759-getting-the-time-a-card-or-board-was-created
    this.dateCreated = new Date(parseInt(card.id.substring(0,8), 16) * 1000)
    this.dateLastActivity = new Date(card.dateLastActivity)
    // If the task has no due date, assume one.
    this.dateDue = card.due ? new Date(card.due) : new Date(Date.now() + opts.defaultTimeDue * 1000)
    this.labels = card.labels.map(label => label.name.toLocaleLowerCase())
    this.name = card.name
    this.position = card.pos
    this.url = card.shortUrl
    this.important = this.labels.includes(opts.importantLabel)
    this.urgent = Boolean(this.dateDue && (this.dateDue.valueOf() < Date.now() + opts.urgentTime * 1000))
    this.rank = this.calculateRank()
  }

  // Factor values are 0-1.
  calculateRank(): number {
    const maxWeight = 10
    const factors: {[key: string]: {weight: number, func: Function}} = {
      age: {
        weight: 2,
        func: (): number => {
          return (Date.now() - this.dateCreated.valueOf()) / (this.dateDue.valueOf() - this.dateCreated.valueOf())
        }
      },
      // dateLastActivity: { // TODO
      //   weight: 5
      // },
      dateDue: {
        weight: 10,
        func: (): number => {
          // TODO make this non-linear, i.e. more weight as the date nears or goes past
          if (this.dateDue.valueOf() < Date.now()) { // overdue
            return 1
          } else {
            // TODO what if due date comes before creation date?
            // TODO what if due date comes before Date.now()?
            // Assume a maximum lifespan of 1 year.
            const maxLife = ONE_YEAR
            const timeUntilMax = maxLife - (this.dateDue.valueOf() - Date.now())
            return timeUntilMax / maxLife
            // const accelerant = 1000
            // score += (accelerant ** distance - 1) / (accelerant - 1)
            // score += distance ** 2 * factors.dateDue.weight
          }
        }
      },
      // importance: {
      //   weight: 5,
      //   func: (): number => {
      //     if (this.labels.includes('important')) {
      //       return 1
      //     } else if (this.labels.includes('not important')) {
      //       return 0.2
      //     } else {
      //       return 0.5
      //     }
      //   }
      // },
      // size: {// TODO
      //   weight: 5
      // }
    }

    // The rank is the average of the scores.
    const total = Object.keys(factors).reduce((soFar: number, key: string): number => {
      const factor = factors[key]
      const val = factor.func()
      return soFar + val * factor.weight
    }, 0)
    return total// / Object.keys(factors).length / maxWeight
  }
}

export const compareTasks = (a: Task, b: Task): number => {
  if (a.dateDue === b.dateDue) {
    // TODO tiebreakers
    // age
    // dateLastActivity
    // dateCreated
    // position
    return 0
  }
  return a.dateDue.valueOf() - b.dateDue.valueOf()
}
