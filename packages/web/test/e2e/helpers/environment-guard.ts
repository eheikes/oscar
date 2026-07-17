import type { Item } from '../../../src/lib/types.js'

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000

const getApiBaseUrl = (): string => {
  return process.env.VITE_API_BASE_URL ?? 'http://localhost:3000'
}

export const validateTestEnvironment = async (): Promise<void> => {
  const apiBaseUrl = getApiBaseUrl()
  const response = await fetch(`${apiBaseUrl}/items?count=100&orderBy=createdAt&orderDir=desc`)

  if (!response.ok) {
    throw new Error(`Test startup check failed: GET /items returned ${response.status}`)
  }

  const items = await response.json() as Item[]
  if (items.length === 0) return

  const cutoff = Date.now() - ONE_YEAR_MS

  const hasNewerItem = items.some((item) => {
    const createdAt = Date.parse(item.createdAt)
    return Number.isNaN(createdAt) || createdAt > cutoff
  })

  if (hasNewerItem) {
    throw new Error('Doesn\'t seem to be running in a test environment, aborting')
  }
}
