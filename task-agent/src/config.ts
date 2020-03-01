import * as dotenv from 'dotenv'
import { readFile } from 'fs'
import { safeLoad } from 'js-yaml'
import { join } from 'path'
import { promisify } from 'util'

export interface EmailConfig {
  message: EmailMessageConfig
  server: EmailServerConfig
  template: EmailTemplateConfig
}

export interface EmailMessageConfig {
  from: string
  to: string
  subject: string
}

export interface EmailServerConfig {
  host: string
  port: number
  secure: boolean
  username: string
  password: string
}

export interface EmailTemplateConfig {
  html: string
  plain: string
}

export interface TodoConfig {
  defaultDue: number
  numUrgentImportant: number
  numImportant: number
  numUrgent: number
  numNotImportant: number
  urgentTime: number
}

export interface TrelloConfig {
  apiKey: string
  apiToken: string
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
  email: EmailConfig
  todos: TodoConfig
  trello: TrelloConfig
}

export interface EnvConfig {
  TRELLO_KEY?: string
  TRELLO_TOKEN?: string
}

export interface YamlConfig {
  email: EmailConfig
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
    config.trello.apiKey = env.parsed.TRELLO_KEY
    config.trello.apiToken = env.parsed.TRELLO_TOKEN
  }

  return config
}
