import { closeDatabaseConnection, migrateDatabase } from './database.js'
import { logger } from './logger.js'

try {
  await migrateDatabase()
  logger.info('Database migrations complete')
} finally {
  await closeDatabaseConnection()
}
