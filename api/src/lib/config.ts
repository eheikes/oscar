import { readFileSync } from 'fs'
import { safeLoad } from 'js-yaml'
import { resolve } from 'path'

const configFilename = resolve(__dirname, '../../config.yml')

export interface RouteConfig {
  controller: string
  method: 'all' | 'delete' | 'get' | 'patch' | 'post' | 'put'
  path: string
}

export interface ServiceConfig {
  routes: RouteConfig[]
}

let config: ServiceConfig

/**
 * Returns the service configuration.
 * Memoizes for repeated calls.
 */
export const getConfig = (): ServiceConfig => {
  if (!config) {
    config = safeLoad(readFileSync(configFilename, 'utf8'))
  }
  return config
}
