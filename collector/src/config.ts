import { readFileSync } from 'fs'
import { safeLoad } from 'js-yaml'

const defaultConfig: OscarConfig = {
  api: {
    name: 'oscar-api',
    protocol: 'http',
    hostname: 'localhost',
    port: 3000,
    pathname: '/'
  },
  database: {
    type: 'sqlite3',
    filename: './oscar.db'
  },
  ranking: {
    numVars: 100,
    numKeywords: 100
  }
}

const getConfig = (filename?: string): OscarConfig => {
  let fileConfig = filename ?
    safeLoad(readFileSync(filename, 'utf8')) as OscarConfig :
    {}
  return Object.assign({}, defaultConfig, fileConfig)
}

export {
  defaultConfig,
  getConfig
}
