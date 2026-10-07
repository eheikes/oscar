import type { Item } from '../../../src/lib/types.js'
import { mockToken } from './auth.js'
import { apiBaseUrl, TEST_ITEM_MARKER } from './config.js'

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000

export const validateTestEnvironment = async (): Promise<void> => {
  let response: Response
  try {
    response = await fetch(`${apiBaseUrl}/items?count=100&orderBy=createdAt&orderDir=desc`, {
      headers: { 'mock-token': mockToken }
    })
  } catch (err) {
    throw new Error(`Test startup check failed: could not reach the API at ${apiBaseUrl}`, { cause: err })
  }

  if (!response.ok) {
    throw new Error(`Test startup check failed: GET /items returned ${response.status} (is the API running with NODE_ENV=test and MOCK_AUTH=true?)`)
  }

  const items = await response.json() as Item[]
  const cutoff = Date.now() - ONE_YEAR_MS

  // Items left over from an aborted test run are expected to be new; they get cleaned up.
  const hasNewerItem = items.some((item) => {
    if (item.title.startsWith(TEST_ITEM_MARKER)) return false
    const createdAt = Date.parse(item.createdAt)
    return Number.isNaN(createdAt) || createdAt > cutoff
  })

  if (hasNewerItem) {
    throw new Error('Doesn\'t seem to be running in a test environment, aborting')
  }
}
