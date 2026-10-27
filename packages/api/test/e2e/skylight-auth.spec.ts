import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { clearConfig, getConfig } from '../../src/config.js'
import { decryptSecret } from '../../src/crypto.js'
import { getDatabaseConnection } from '../../src/database.js'
import type { DatabaseIntegrationToken } from '../../src/integrations/skylight-auth.js'
import { clearIntegrations } from '../../src/integrations/index.js'
import { authedRequest } from './helpers/auth.js'
import { type FakeSkylight, setEnv as setProcessEnv, startFakeSkylight } from './helpers/fake-skylight.js'

// Tests for the Skylight integration using an OAuth refresh token (instead of SKYLIGHT_AUTH_HEADER).
describe('Skylight authentication with a refresh token', () => {
  const db = getDatabaseConnection()
  const task = {
    id: 'bdb76fb4-98aa-4b48-bb9c-fc647199e09f',
    title: 'Take out the trash',
    type_id: 'task',
    created_at: new Date('2024-05-31T06:28:47.753Z'),
    updated_at: new Date('2024-05-31T06:28:47.753Z')
  }
  const choreResponse = { status: 200, body: { data: { type: 'chore', id: '98765', attributes: {} } } }

  let fake: FakeSkylight
  let app: Parameters<typeof authedRequest>[0]
  let handler: (event: object, context: object) => Promise<unknown>
  let originalEnv: NodeJS.ProcessEnv

  const setEnv = (env: Record<string, string | undefined>): void => {
    setProcessEnv(env)
    clearConfig()
  }

  const sendTask = async (expectedStatus = 201): Promise<Record<string, unknown>> => {
    const response = await authedRequest(app).post('/integrations/skylight/chores')
      .send({ itemId: task.id })
      .expect(expectedStatus)
    return response.body
  }

  const tokenRequests = (): unknown[] => fake.requests.filter(r => r.url === '/oauth/token').map(r => r.body)
  const apiAuthHeaders = (): unknown[] => fake.requests.filter(r => r.url.startsWith('/api/')).map(r => r.headers.authorization)
  const getTokenRow = async (): Promise<DatabaseIntegrationToken | undefined> => await db('integration_tokens').where({ integration_id: 'skylight' }).first()

  beforeAll(async () => {
    fake = await startFakeSkylight()
    getConfig() // load the .env files into process.env first
    originalEnv = { ...process.env }
    setEnv({
      INTEGRATIONS: 'skylight',
      SKYLIGHT_API_URL: fake.apiUrl,
      SKYLIGHT_AUTH_HEADER: undefined,
      SKYLIGHT_CATEGORY_ID: '13600771',
      SKYLIGHT_DEVICE_FINGERPRINT: 'device-1',
      SKYLIGHT_FRAME_ID: '4567',
      SKYLIGHT_OAUTH_URL: fake.oauthUrl
    })
    clearIntegrations()
    // Load the app after the config is set, so the integration's routes are added.
    ;({ app } = await import('../../src/app.js'))
    ;({ handler } = await import('../../src/serverless.js'))
  })

  afterAll(async () => {
    process.env = originalEnv
    clearConfig()
    clearIntegrations()
    await fake.close()
  })

  beforeEach(async () => {
    fake.reset()
    fake.apiResponse = choreResponse
    fake.tokenResponse = { status: 200, body: { access_token: 'access-1', refresh_token: 'refresh-2', expires_in: 3600, token_type: 'Bearer' } }
    setEnv({ SKYLIGHT_REFRESH_TOKEN: 'seed-refresh' })
    await db('integration_tokens').delete()
    await db('item_integration_links').delete()
    await db('item_labels').delete()
    await db('items').delete()
    await db('items').insert(task)
  })

  it('should get an access token with the refresh token, and use it', async () => {
    await sendTask()
    expect(tokenRequests()).toEqual([{
      grant_type: 'refresh_token',
      refresh_token: 'seed-refresh',
      client_id: 'skylight-mobile',
      skylight_api_client_device_fingerprint: 'device-1'
    }])
    expect(apiAuthHeaders()).toEqual(['Bearer access-1'])
  })

  it('should store the new tokens, encrypted', async () => {
    await sendTask()
    const row = await getTokenRow()
    expect(row?.refresh_token).not.toContain('refresh-2')
    expect(row?.access_token).not.toContain('access-1')
    expect(decryptSecret(row?.refresh_token ?? '')).toBe('refresh-2')
    expect(decryptSecret(row?.access_token ?? '')).toBe('access-1')
    expect(new Date(row?.access_token_expires_at ?? 0).getTime()).toBeGreaterThan(Date.now() + 3500 * 1000)
  })

  it('should reuse the access token until it expires', async () => {
    await sendTask()
    await sendTask()
    expect(tokenRequests()).toHaveLength(1)
    expect(apiAuthHeaders()).toEqual(['Bearer access-1', 'Bearer access-1'])
  })

  it('should use the latest refresh token once the access token expires', async () => {
    await sendTask()
    await db('integration_tokens').update({ access_token_expires_at: new Date(Date.now() + 30 * 1000) })
    fake.tokenResponse = { status: 200, body: { access_token: 'access-2', refresh_token: 'refresh-3', expires_in: 3600 } }
    await sendTask()
    expect(tokenRequests()).toMatchObject([{ refresh_token: 'seed-refresh' }, { refresh_token: 'refresh-2' }])
    expect(apiAuthHeaders()).toEqual(['Bearer access-1', 'Bearer access-2'])
    expect(decryptSecret((await getTokenRow())?.refresh_token ?? '')).toBe('refresh-3')
  })

  it('should keep using the refresh token if it is not rotated', async () => {
    fake.tokenResponse = { status: 200, body: { access_token: 'access-1' } }
    await sendTask()
    const row = await getTokenRow()
    expect(decryptSecret(row?.refresh_token ?? '')).toBe('seed-refresh')
    // Without an expiry, assume an hour.
    expect(new Date(row?.access_token_expires_at ?? 0).getTime()).toBeGreaterThan(Date.now() + 3500 * 1000)
  })

  it('should start over with a new SKYLIGHT_REFRESH_TOKEN', async () => {
    await sendTask()
    setEnv({ SKYLIGHT_REFRESH_TOKEN: 'new-seed' })
    await sendTask()
    expect(tokenRequests()).toMatchObject([{ refresh_token: 'seed-refresh' }, { refresh_token: 'new-seed' }])
  })

  it('should keep using the stored tokens without SKYLIGHT_REFRESH_TOKEN', async () => {
    await sendTask()
    setEnv({ SKYLIGHT_REFRESH_TOKEN: undefined })
    await db('integration_tokens').update({ access_token_expires_at: new Date(0) })
    await sendTask()
    expect(tokenRequests()).toMatchObject([{ refresh_token: 'seed-refresh' }, { refresh_token: 'refresh-2' }])
  })

  it('should refresh the access token and retry if Skylight rejects it', async () => {
    await sendTask()
    fake.apiResponses = [{ status: 401, body: {} }]
    fake.tokenResponse = { status: 200, body: { access_token: 'access-2', refresh_token: 'refresh-3', expires_in: 3600 } }
    await sendTask()
    expect(apiAuthHeaders()).toEqual(['Bearer access-1', 'Bearer access-1', 'Bearer access-2'])
  })

  it('should only retry once', async () => {
    fake.apiResponse = { status: 401, body: {} }
    const body = await sendTask(502)
    expect(body).toEqual({ error: 'The Skylight API responded with status 401' })
    expect(apiAuthHeaders()).toHaveLength(2)
  })

  it('should only refresh once for simultaneous requests', async () => {
    fake.tokenDelayMs = 200
    await Promise.all([sendTask(), sendTask(), sendTask()])
    expect(tokenRequests()).toHaveLength(1)
    expect(apiAuthHeaders()).toEqual(['Bearer access-1', 'Bearer access-1', 'Bearer access-1'])
  })

  it('should return a 502 if the refresh token is rejected', async () => {
    fake.tokenResponse = { status: 400, body: { error: 'invalid_grant' } }
    const body = await sendTask(502)
    expect(body).toEqual({ error: 'Skylight rejected the refresh token (status 400). Set a new SKYLIGHT_REFRESH_TOKEN on the server (see the README)' })
    expect(apiAuthHeaders()).toHaveLength(0)
    // Nothing is saved, so the same token is tried again.
    fake.tokenResponse = { status: 200, body: { access_token: 'access-1', refresh_token: 'refresh-2' } }
    await sendTask()
    expect(tokenRequests()).toMatchObject([{ refresh_token: 'seed-refresh' }, { refresh_token: 'seed-refresh' }])
  })

  it('should return a 502 for other token errors', async () => {
    fake.tokenResponse = { status: 503, body: {} }
    expect(await sendTask(502)).toEqual({ error: 'The Skylight login service responded with status 503' })

    fake.tokenResponse = { status: 200, body: { token_type: 'Bearer' } }
    expect(await sendTask(502)).toEqual({ error: 'The Skylight login service did not return an access token' })

    setEnv({ SKYLIGHT_OAUTH_URL: 'http://127.0.0.1:1/oauth/token' })
    expect(await sendTask(502)).toEqual({ error: 'Could not reach the Skylight login service' })
    setEnv({ SKYLIGHT_OAUTH_URL: fake.oauthUrl })
  })

  it('should return a 500 if there is no refresh token', async () => {
    setEnv({ SKYLIGHT_REFRESH_TOKEN: undefined })
    const body = await sendTask(500)
    expect(body).toEqual({ error: 'No Skylight refresh token is available. Set SKYLIGHT_REFRESH_TOKEN on the server (see the README)' })
    expect(fake.requests).toHaveLength(0)
  })

  describe('scheduled runs', () => {
    const scheduledEvent = { source: 'aws.events', 'detail-type': 'Scheduled Event', detail: {} }

    it('should refresh the tokens even if they are still valid', async () => {
      await sendTask()
      fake.tokenResponse = { status: 200, body: { access_token: 'access-2', refresh_token: 'refresh-3', expires_in: 3600 } }
      expect(await handler(scheduledEvent, {})).toEqual({ ok: true })
      expect(tokenRequests()).toMatchObject([{ refresh_token: 'seed-refresh' }, { refresh_token: 'refresh-2' }])
      expect(decryptSecret((await getTokenRow())?.refresh_token ?? '')).toBe('refresh-3')
    })

    it('should fail if the tokens cannot be refreshed', async () => {
      fake.tokenResponse = { status: 400, body: { error: 'invalid_grant' } }
      await expect(handler(scheduledEvent, {})).rejects.toThrow('Scheduled tasks failed for: skylight')
    })

    it('should still handle API requests', async () => {
      const response = await handler({
        httpMethod: 'GET',
        path: '/integrations',
        headers: {},
        requestContext: {}
      }, {}) as { statusCode: number }
      expect(response.statusCode).toBe(401) // no credentials
      expect(fake.requests).toHaveLength(0)
    })
  })
})
