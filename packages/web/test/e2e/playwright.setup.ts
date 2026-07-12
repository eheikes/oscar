import type { FullConfig } from '@playwright/test'
import { validateTestEnvironment } from './helpers/environment-guard.js'

const globalSetup = async (_config: FullConfig): Promise<void> => {
  await validateTestEnvironment()
}

export default globalSetup
