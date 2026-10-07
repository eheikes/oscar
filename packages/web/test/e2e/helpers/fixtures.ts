import { test as base } from '@playwright/test'
import { deleteItems } from './api.js'
import { blockAuth0, routeApiWithMockToken, seedAuth0Session } from './auth.js'
import { TEST_ITEM_MARKER } from './config.js'

interface Fixtures {
  // Whether the page starts out logged in.
  authenticated: boolean
  // A unique title prefix for this test's items. Searching for it finds only this test's items.
  prefix: string
}

export const test = base.extend<Fixtures>({
  authenticated: [true, { option: true }],

  // eslint-disable-next-line no-empty-pattern
  prefix: async ({}, use, testInfo) => {
    const prefix = `${TEST_ITEM_MARKER}${testInfo.workerIndex}-${Date.now().toString(36)}`
    await use(prefix)
    await deleteItems(prefix)
  },

  page: async ({ page, authenticated }, use) => {
    await blockAuth0(page)
    await routeApiWithMockToken(page)
    if (authenticated) {
      await seedAuth0Session(page)
    }
    await use(page)
  }
})

export { expect } from '@playwright/test'
