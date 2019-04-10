import * as Knex from 'knex'
import { QueryResult } from 'pg'
import { Environment } from './config'

interface DatabaseOptions {
  database?: string
  host?: string
  password?: string
  user?: string
}

export class DatabaseConnection {
  private knex: Knex

  constructor (opts: DatabaseOptions) {
    this.knex = Knex({
      client: 'pg',
      debug: true,
      connection: {
        database: opts.database,
        host: opts.host,
        password: opts.password,
        user: opts.user
      }
    })
  }

  /**
   * Performs a SQL query against the database.
   * See https://knexjs.org/#Raw for how to use bindings.
   */
  async query (sql: string, bindings: any[] = []): Promise<QueryResult> {
    return this.knex.raw(sql, bindings).then<QueryResult>(r => r)
  }
}

let db: DatabaseConnection

export const getDatabaseConnection = (): DatabaseConnection => {
  if (!db) {
    throw new Error('Database not established with setDatabaseConnection() first')
  }
  return db
}

export const setDatabaseConnection = (env: Environment): DatabaseConnection => {
  const envValue = (name: string): string | undefined =>
    (env && env[name]) ? env[name] : undefined
  db = new DatabaseConnection({
    database: envValue('DATABASE_NAME'),
    host: envValue('DATABASE_HOST'),
    password: envValue('DATABASE_PASSWORD'),
    user: envValue('DATABASE_USER')
  })
  return db
}
