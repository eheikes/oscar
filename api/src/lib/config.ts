import { DotenvParseOutput, parse } from 'dotenv'
import { existsSync, readFileSync } from 'fs'
import { safeLoad } from 'js-yaml'
import { join } from 'path'

const configFilename = 'config.yml'
const envFilename = '.env'

export type Environment = DotenvParseOutput

export interface RouteConfig {
  controller: string
  method: 'all' | 'delete' | 'get' | 'patch' | 'post' | 'put'
  path: string
}

export interface ServiceConfig {
  env: Environment
  routes: RouteConfig[]
}

let config: ServiceConfig | null = null

/**
 * Returns the service configuration.
 * Memoizes for repeated calls.
 */
export const getConfig = (rootPath: string): ServiceConfig => {
  if (!config) {
    // Load the config.yml file.
    const configFile = join(rootPath, configFilename)
    config = safeLoad(readFileSync(configFile, 'utf8')) as ServiceConfig

    // Load the .env file.
    const envFile = join(rootPath, envFilename)
    config.env = {}
    if (existsSync(envFile)) {
      config.env = parse(readFileSync(envFile))
    }
  }
  return config
}

export const reset = () => {
  config = null
}
