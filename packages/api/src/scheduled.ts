// Runs the scheduled tasks once, e.g. from cron when not running in AWS Lambda.
import { closeDatabaseConnection } from './database.js'
import { runScheduledTasks } from './integrations/index.js'

try {
  await runScheduledTasks()
} finally {
  await closeDatabaseConnection()
}
