import { readFileSync } from 'fs'
import knex, { Knex } from 'knex'
import { getConfig } from './config.js'

export { type Knex } from 'knex'

let connection: Knex | null = null

const getCert = (filename: string): string => {
  return readFileSync(filename).toString()
}

export const getDatabaseConnection = (): Knex => {
  if (connection === null) {
    const config = getConfig()
    connection = knex({
      client: 'pg',
      connection: {
        host: config.DB_HOST,
        port: config.DB_PORT,
        user: config.DB_USER,
        password: config.DB_PASSWORD,
        database: config.DB_NAME,
        ssl: config.DB_SSL
          ? {
              rejectUnauthorized: config.DB_REJECT_UNAUTHORIZED,
              ca: typeof config.DB_CA_FILE === 'string' ? getCert(config.DB_CA_FILE) : undefined
            }
          : false,
        // Detect connections silently dropped by the network (e.g. NAT, Lambda VPC idle timeout)
        // so queries fail fast instead of hanging forever.
        keepAlive: true, // TCP keepalive helps detect dead peers
        keepAliveInitialDelayMillis: 10000,
        connectionTimeoutMillis: 5000, // give up opening a connection after 5s
        query_timeout: 15000, // client-side: reject a query that gets no reply in 15s
        statement_timeout: 15000 // server-side: Postgres cancels long queries
      },
      pool: {
        // Don't keep idle connections around; they can go stale (e.g. after sleep or Lambda freeze).
        min: 0, // don't hold idle connections forever (default is 2)
        max: 10,
        idleTimeoutMillis: 30000 // close connections idle for 30s
      },
      acquireConnectionTimeout: 10000
    })
  }
  return connection
}

export const migrateDatabase = async (): Promise<void> => {
  const db = getDatabaseConnection()
  await db.migrate.latest({
    directory: './src/migrations'
  })
}

export const raw = (value: string): Knex.Raw => {
  const db = getDatabaseConnection()
  return db.raw(value)
}
