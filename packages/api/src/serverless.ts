import serverless from 'serverless-http'
import { app } from './app.js'
import { runScheduledTasks } from './integrations/index.js'

const httpHandler = serverless(app)

// Events from EventBridge rules (or Scheduler schedules sending this input) run the scheduled tasks.
const isScheduledEvent = (event: unknown): boolean => {
  return (event as { 'detail-type'?: unknown } | null)?.['detail-type'] === 'Scheduled Event'
}

export const handler: serverless.Handler = async (event, context) => {
  if (isScheduledEvent(event)) {
    await runScheduledTasks()
    return { ok: true }
  }
  return await httpHandler(event, context)
}
