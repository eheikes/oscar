//
// Configuration
//
interface OscarApiConfig {
  name?: string
  protocol?: string
  hostname?: string
  port?: number
  pathname?: string
}

interface OscarDatabaseConfig {
  type: string
  host?: string
  user?: string
  port?: number
  socket?: string
  ssl?: boolean
  password?: string
  name?: string
  filename?: string
  pool?: boolean
}

interface OscarRankingConfig {
  numVars?: number // how many items to use for the MLR ranking
  numKeywords?: number // max number of keywords to include in ranking
}

interface OscarConfig {
  api?: OscarApiConfig
  database?: OscarDatabaseConfig
  ranking?: OscarRankingConfig
}
