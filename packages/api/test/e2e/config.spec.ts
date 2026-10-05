import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { clearConfig, getConfig } from '../../src/config.js'

describe('config', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeAll(() => {
    getConfig() // load the .env files into process.env first
    originalEnv = { ...process.env }
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    clearConfig()
  })

  describe('MOCK_AUTH', () => {
    it('should be allowed in a local test environment', () => {
      process.env.MOCK_AUTH = 'true'
      process.env.APP_URL = 'http://localhost:8080'
      clearConfig()

      expect(getConfig().MOCK_AUTH).toBe(true)
    })

    it('should not be allowed in production', () => {
      process.env.MOCK_AUTH = 'true'
      process.env.NODE_ENV = 'production'
      clearConfig()

      expect(() => getConfig()).toThrow('MOCK_AUTH cannot be enabled when NODE_ENV is "production"')
    })

    it('should not be allowed when NODE_ENV is unset', () => {
      process.env.MOCK_AUTH = 'true'
      delete process.env.NODE_ENV
      clearConfig()

      // Run from an empty directory, so a .env file can't set NODE_ENV.
      const originalCwd = process.cwd()
      const emptyDir = mkdtempSync(join(tmpdir(), 'oscar-config-'))
      try {
        process.chdir(emptyDir)
        expect(() => getConfig()).toThrow('MOCK_AUTH cannot be enabled when NODE_ENV is ""')
      } finally {
        process.chdir(originalCwd)
        rmSync(emptyDir, { recursive: true })
      }
    })

    it('should not be allowed with a non-localhost APP_URL', () => {
      process.env.MOCK_AUTH = 'true'
      process.env.APP_URL = 'https://oscar.example.com'
      clearConfig()

      expect(() => getConfig()).toThrow('MOCK_AUTH can only be enabled when APP_URL is a localhost URL')
    })
  })
})
