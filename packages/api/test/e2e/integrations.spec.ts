import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../../src/app.js'
import { clearConfig, getConfig } from '../../src/config.js'
import { clearIntegrations, getEnabledIntegrations } from '../../src/integrations/index.js'
import { authedRequest } from './helpers/auth.js'

// These tests use the default test config, which doesn't enable any integrations.
// See skylight.spec.ts for tests with the Skylight integration enabled.
describe('integrations', () => {
  describe('GET /integrations', () => {
    it('should return an empty list when no integrations are enabled', async () => {
      const response = await authedRequest(app).get('/integrations')
        .expect(200)
      expect(response.body).toEqual([])
    })
  })

  describe('disabled integrations', () => {
    it('should not have routes', async () => {
      await authedRequest(app).post('/integrations/skylight/chores')
        .send({ itemId: 'bdb76fb4-98aa-4b48-bb9c-fc647199e09f' })
        .expect(404)
    })
  })

  describe('INTEGRATIONS setting', () => {
    let originalEnv: NodeJS.ProcessEnv

    beforeAll(() => {
      getConfig() // load the .env files into process.env first
      originalEnv = { ...process.env }
    })

    afterEach(() => {
      process.env = { ...originalEnv }
      clearConfig()
      clearIntegrations()
    })

    const reload = (env: Record<string, string>): void => {
      Object.assign(process.env, env)
      clearConfig()
      clearIntegrations()
    }

    it('should enable the listed integrations', () => {
      reload({ INTEGRATIONS: ' skylight, skylight ', SKYLIGHT_AUTH_HEADER: 'Basic abc', SKYLIGHT_FRAME_ID: '123' })
      expect(getEnabledIntegrations().map(integration => integration.id)).toEqual(['skylight'])
    })

    it('should not allow unknown integrations', () => {
      reload({ INTEGRATIONS: 'skylight,bogus', SKYLIGHT_AUTH_HEADER: 'Basic abc', SKYLIGHT_FRAME_ID: '123' })
      expect(() => getEnabledIntegrations()).toThrow('Unknown integration "bogus" in INTEGRATIONS')
    })

    it('should require the Skylight auth header', () => {
      reload({ INTEGRATIONS: 'skylight', SKYLIGHT_AUTH_HEADER: ' ', SKYLIGHT_FRAME_ID: '123' })
      expect(() => getEnabledIntegrations()).toThrow('SKYLIGHT_AUTH_HEADER must be set to enable the Skylight integration')
    })

    it('should require the Skylight frame ID', () => {
      reload({ INTEGRATIONS: 'skylight', SKYLIGHT_AUTH_HEADER: 'Basic abc' })
      delete process.env.SKYLIGHT_FRAME_ID
      clearConfig()
      expect(() => getEnabledIntegrations()).toThrow('SKYLIGHT_FRAME_ID must be set to enable the Skylight integration')
    })

    it('should require a valid Skylight time zone', () => {
      reload({ INTEGRATIONS: 'skylight', SKYLIGHT_AUTH_HEADER: 'Basic abc', SKYLIGHT_FRAME_ID: '123', SKYLIGHT_TIMEZONE: 'Mars/Olympus' })
      expect(() => getEnabledIntegrations()).toThrow('SKYLIGHT_TIMEZONE "Mars/Olympus" is not a valid time zone')
    })
  })
})
