import * as chalk from 'chalk'

const app = 'oscar:task-agent'

export const log = (namespace: string, ...data: any[]): void => {
  const msg: string = data.reduce((soFar: string, val: any) => {
    if (typeof val === 'object') {
      return `${soFar} ${JSON.stringify(val)}`
    } else {
      return `${soFar} ${String(val)}`
    }
  }, '')
  console.log(chalk.blue(`${app}:${namespace}`), chalk.white(msg))
}
