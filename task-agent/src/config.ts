import * as dotenv from 'dotenv'
import { readFile } from 'fs'
import { safeLoad } from 'js-yaml'
import { join } from 'path'
import { promisify } from 'util'

interface EmailConfig {
  message: EmailMessageConfig
  server: EmailServerConfig
}

interface EmailMessageConfig {
  from: string
  to: string
  subject: string
}

interface EmailServerConfig {
  host: string
  port: number
  secure: boolean
  username: string
  password: string
}

interface TrelloConfig {
  apiKey: string
  apiToken: string
  cardsPerList: number
  lists: string[]
}

interface Config {
  email: EmailConfig
  trello: TrelloConfig
}

let config: Config | null = null

export const getConfig = async (): Promise<Config> => {
  if (config) { return config }

  const yamlContents = await promisify(readFile)(join('config.yml'), 'utf8')
  config = safeLoad(yamlContents) as Config

  const env = dotenv.config()
  if (env.parsed) {
    config.trello.apiKey = env.parsed.TRELLO_KEY
    config.trello.apiToken = env.parsed.TRELLO_TOKEN
  }

  return config
}
