import type { Page } from '@playwright/test'
import { apiBaseUrl, auth0Audience, auth0ClientId, auth0Domain, testUser } from './config.js'

const ONE_DAY_SECONDS = 24 * 60 * 60

const base64url = (value: object): string => Buffer.from(JSON.stringify(value)).toString('base64url')

// An unsigned JWT. The API only accepts it with MOCK_AUTH enabled (via the mock-token header).
export const createMockToken = (claims: Record<string, unknown> = {}): string => {
  const now = Math.floor(Date.now() / 1000)
  const payload = { ...testUser, aud: auth0Audience, iat: now, exp: now + ONE_DAY_SECONDS, ...claims }
  return `${base64url({ alg: 'none', typ: 'JWT' })}.${base64url(payload)}.`
}

export const mockToken = createMockToken()

// Entries for the Auth0 SPA SDK's localStorage cache, as if the user had logged in.
const auth0CacheEntries = (): Record<string, object> => {
  const now = Math.floor(Date.now() / 1000)
  const scope = 'openid profile email offline_access'
  const claims = { ...testUser, __raw: mockToken, aud: auth0ClientId, iat: now, exp: now + ONE_DAY_SECONDS }
  const entries = {
    [`@@auth0spajs@@::${auth0ClientId}::${auth0Audience}::${scope}`]: {
      body: {
        client_id: auth0ClientId,
        audience: auth0Audience,
        scope,
        access_token: mockToken,
        token_type: 'Bearer',
        expires_in: ONE_DAY_SECONDS
      },
      expiresAt: now + ONE_DAY_SECONDS
    },
    [`@@auth0spajs@@::${auth0ClientId}::@@user@@`]: {
      id_token: mockToken,
      decodedToken: {
        encoded: { header: '', payload: '', signature: '' },
        header: { alg: 'none', typ: 'JWT' },
        claims,
        user: testUser
      }
    }
  }
  return entries
}

// Pre-populate the Auth0 cache before the app loads, so it sees a
// logged-in user without ever talking to Auth0.
export const seedAuth0Session = async (page: Page): Promise<void> => {
  await page.addInitScript((entries) => {
    // Only seed once per test, so logging out isn't undone by the next page load.
    if (sessionStorage.getItem('e2e_auth_seeded') !== null) return
    sessionStorage.setItem('e2e_auth_seeded', 'true')
    for (const [key, value] of Object.entries(entries)) {
      localStorage.setItem(key, JSON.stringify(value))
    }
  }, auth0CacheEntries())
}

// Logs in on an already-loaded page, like completing the Auth0 login would.
// The app picks this up the next time it's loaded.
export const logIn = async (page: Page): Promise<void> => {
  await page.evaluate((entries) => {
    for (const [key, value] of Object.entries(entries)) {
      localStorage.setItem(key, JSON.stringify(value))
    }
  }, auth0CacheEntries())
}

// The browser sends the mock token as a Bearer token, which the API would try
// to verify against Auth0. Send it in the mock-token header instead.
export const routeApiWithMockToken = async (page: Page): Promise<void> => {
  await page.route(`${apiBaseUrl}/**`, async (route) => {
    const { authorization: _, ...headers } = route.request().headers()
    await route.continue({ headers: { ...headers, 'mock-token': mockToken } })
  })
}

// The app should never need to reach Auth0 in the tests.
export const blockAuth0 = async (page: Page): Promise<void> => {
  if (auth0Domain === '') return
  await page.route(`https://${auth0Domain}/**`, async (route) => { await route.abort() })
}
