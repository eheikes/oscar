import type { FullConfig } from '@playwright/test'
import { deleteItems } from './helpers/api.js'
import { validateTestEnvironment } from './helpers/environment-guard.js'

const globalSetup = async (_config: FullConfig): Promise<void> => {
  await validateTestEnvironment()
  // Remove anything left behind by an aborted run.
  await deleteItems()
}

export default globalSetup
