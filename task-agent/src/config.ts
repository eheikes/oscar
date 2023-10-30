import * as dotenv from 'dotenv'
import { readFile } from 'fs'
import { safeLoad } from 'js-yaml'
import { join } from 'path'
import { promisify } from 'util'
import { Importance } from './task'

export interface ChooserBudgetConfig {
  important?: number
  unimportant?: number
}

export interface ChooserBudgetsConfig {
  mon?: ChooserBudgetConfig
  tue?: ChooserBudgetConfig
  wed?: ChooserBudgetConfig
  thu?: ChooserBudgetConfig
  fri?: ChooserBudgetConfig
  sat?: ChooserBudgetConfig
  sun?: ChooserBudgetConfig
}

export interface ChooserDefaultsConfig {
  deadline?: number | 'ignore'
  label?: Importance | 'ignore'
  size?: number | 'ignore'
}

export interface ChooserDestinationConfig {
  board?: string
  list?: string
}

export interface ChooserLabelsConfig {
  important?: string
  unimportant?: string
}

export interface ChooserConfig {
  budgets?: ChooserBudgetsConfig
  defaults?: ChooserDefaultsConfig
  destination?: ChooserDestinationConfig
  labels?: ChooserLabelsConfig
  rescheduleOverdueTasks?: boolean
  sendOverdueEmail?: boolean
  sources?: string[]
}

export interface EmailConfig {
  message: EmailMessageConfig
  server: EmailServerConfig
}

export interface EmailMessageConfig {
  from: string
  to: string
}

export interface EmailServerConfig {
  host: string
  port: number
  secure: boolean
  username: string
  password: string
}


export interface RecurringConfig {
  description?: string
  every?: number // TODO
  labels?: string[] // TODO
  list: string
  name: string
  // size?: number
  due?: string // HH:MM
  projectId: number
  groupId?: number
  assignee?: number
  type: 'date' | 'dow' | 'month' | 'year'
  value: number | string
}

export interface TeamGanttConfig {
  apiUrl: string
  authUrl: string
  clientId: string
  clientSecret: string
  username: string
  password: string
}

export interface TodoConfig {
  defaultDue: number
  importantAmount: number
  recurring?: RecurringConfig[]
  recurringArchive?: string[]
  urgentAmount: number
  urgentTime: number
}

export interface TrelloConfig {
  apiKey: string
  apiToken: string
  cardSizePluginId: string
  cardSizeUnit: string
  cardsPerList: number
  labels: TrelloLabelsConfig
  lists: string[]
  url: string
}

export interface TrelloLabelsConfig {
  important: string
  unimportant: string
}

export interface Config {
  chooser?: ChooserConfig
  email: EmailConfig
  teamgantt: TeamGanttConfig
  todos: TodoConfig
  trello: TrelloConfig
}

export interface EnvConfig {
  TRELLO_KEY?: string
  TRELLO_TOKEN?: string
  TEAMGANTT_CLIENT_ID?: string
  TEAMGANTT_CLIENT_SECRET?: string
  TEAMGANTT_PASSWORD?: string
  TEAMGANTT_USERNAME?: string
}

export interface YamlConfig {
  email: EmailConfig
  teamgantt: Omit<TeamGanttConfig, 'clientId' | 'clientSecret' | 'password' | 'username'>
  todos: TodoConfig
  trello: Omit<TrelloConfig, 'apiKey' | 'apiToken'>
}

let config: Config | null = null

export const getConfig = async (): Promise<Config> => {
  if (config) { return config }

  const yamlContents = await promisify(readFile)(join(process.env.CONFIG_FILE ?? 'config.yml'), 'utf8')
  config = safeLoad(yamlContents) as Config

  const env = dotenv.config()
  if (env.parsed) {
    config.teamgantt.clientId = env.parsed.TEAMGANTT_CLIENT_ID
    config.teamgantt.clientSecret = env.parsed.TEAMGANTT_CLIENT_SECRET
    config.teamgantt.username = env.parsed.TEAMGANTT_USERNAME
    config.teamgantt.password = env.parsed.TEAMGANTT_PASSWORD
    config.trello.apiKey = env.parsed.TRELLO_KEY
    config.trello.apiToken = env.parsed.TRELLO_TOKEN
  }

  return config
}
