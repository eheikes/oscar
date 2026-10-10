import { closeDatabaseConnection, migrateDatabase } from '../../../src/database.js'

export default async (): Promise<void> => {
  await migrateDatabase()
  await closeDatabaseConnection()
}
