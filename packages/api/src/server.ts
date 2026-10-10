import { app } from './app.js'
import { migrateDatabase } from './database.js'
import { logger } from './logger.js'

const port = process.env.PORT === undefined ? 8080 : parseInt(process.env.PORT, 10)

await migrateDatabase()

app.listen(port, () => {
  logger.info({ port }, 'App listening')
})
