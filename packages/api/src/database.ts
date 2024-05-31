import { readFileSync } from 'fs'
import knex, { Knex } from 'knex'
import { config } from './config.js'

let connection: Knex | null = null

const getCert = (filename: string): string => {
  return readFileSync(filename).toString()
}

export const getDatabaseConnection = () => {
  if (!connection) {
    connection = knex({
      client: 'pg',
      connection: {
        host: config.DB_HOST,
        port: config.DB_PORT,
        user: config.DB_USER,
        password: config.DB_PASSWORD,
        database: config.DB_NAME,
        ssl: config.DB_SSL ? {
          rejectUnauthorized: true,
          ca: getCert('./rds-ca-bundle.pem'),
        } : false
      },
    })
  }
  return connection
}
