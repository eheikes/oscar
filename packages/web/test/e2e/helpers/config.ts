import { loadEnv } from 'vite'

// Load the same .env files the dev server uses (NODE_ENV=test loads .env.test),
// so the tests talk to the same API and use the same Auth0 client as the app.
// As with Vite, environment variables take precedence over the files.
const env = loadEnv(process.env.NODE_ENV ?? 'test', process.cwd(), 'VITE_')

export const apiBaseUrl = env.VITE_API_BASE_URL ?? 'http://localhost:3000'
export const auth0ClientId = env.VITE_AUTH0_CLIENT_ID ?? ''
export const auth0Audience = env.VITE_AUTH0_AUDIENCE ?? ''
export const auth0Domain = env.VITE_AUTH0_DOMAIN ?? ''

// Every item the tests create has a title starting with this marker,
// so leftovers from an aborted run can be recognized and cleaned up.
export const TEST_ITEM_MARKER = 'E2E-'

// Must be in the API's ALLOWED_USERS list.
export const testUser = {
  sub: 'auth0|e2e-user',
  email: 'e2e-user@example.com',
  name: 'E2E User'
}
