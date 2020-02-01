export interface Task {
  id: string
  dateCreated: Date
  dateLastActivity: Date
  dateDue: Date | null
  labels: string[]
  name: string
  position: number
  url: string
  rank: number
}

const ONE_DAY = 1000 * 60 * 60 * 24
const ONE_WEEK = ONE_DAY * 7
const ONE_YEAR = ONE_DAY * 365

// Factor values are 0-1.
export const calculateTaskRank = (task: Task): number => {
  const maxWeight = 10
  const factors: {[key: string]: {weight: number, func: Function}} = {
    age: {
      weight: 2,
      func: (task: Task): number => {
        // If the task has no due date, assume a due date in 2 weeks.
        // TODO DRY this out
        if (!task.dateDue) {
          task.dateDue = new Date(Date.now() + ONE_WEEK * 2)
        }
        return (Date.now() - task.dateCreated.valueOf()) / (task.dateDue.valueOf() - task.dateCreated.valueOf())
      }
    },
    // dateLastActivity: { // TODO
    //   weight: 5
    // },
    dateDue: {
      weight: 10,
      func: (task: Task): number => {
        // If the task has no due date, assume a due date in 2 weeks.
        if (!task.dateDue) {
          task.dateDue = new Date(Date.now() + ONE_WEEK * 2)
        }

        // TODO make this non-linear, i.e. more weight as the date nears or goes past
        if (task.dateDue.valueOf() < Date.now()) { // overdue
          return 1
        } else {
          // TODO what if due date comes before creation date?
          // TODO what if due date comes before Date.now()?
          // Assume a maximum lifespan of 1 year.
          const maxLife = ONE_YEAR
          const timeUntilMax = maxLife - (task.dateDue.valueOf() - Date.now())
          return timeUntilMax / maxLife
          // const accelerant = 1000
          // score += (accelerant ** distance - 1) / (accelerant - 1)
          // score += distance ** 2 * factors.dateDue.weight
        }
      }
    },
    // importance: {
    //   weight: 5,
    //   func: (task: Task): number => {
    //     if (task.labels.includes('important')) {
    //       return 1
    //     } else if (task.labels.includes('not important')) {
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
    const val = factor.func(task)
    return soFar + val * factor.weight
  }, 0)
  return total// / Object.keys(factors).length / maxWeight
}

export const compareTasks = (a: Task, b: Task): number => {
  const aRank = a.rank
  const bRank = b.rank
  if (aRank === bRank) {
    // TODO tiebreakers
    if (a.dateDue !== b.dateDue) {
      // return a.dateDue - b.dateDue
    }
    // return a.dateLastActivity - b.dateLastActivity
    // TODO consider position
  }
  return bRank - aRank
}
