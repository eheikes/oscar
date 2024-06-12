import esmock from 'esmock'
import { clearConfig } from '../../src/config.js'

describe('config', () => {
  describe('getConfig()', () => {
    it('should return the config', async () => {
      process.env.APP_URL = 'http://localhost'
      process.env.DB_HOST = 'localhost'
      process.env.DB_PORT = '5432'
      process.env.DB_SSL = '0'
      process.env.DB_NAME = 'postgres'
      process.env.DB_USER = 'postgres'
      process.env.DB_PASSWORD = 'test'
      process.env.ENCRYPTION_KEY = 'test'
      process.env.OPENID_CLIENT_ID = 'client ID'
      process.env.OPENID_CLIENT_SECRET = 'client secret'
      process.env.OPENID_URL = 'https://localhost'
      const { getConfig } = await esmock('../../src/config.js', {
        dotenv: {
          config: () => {}
        }
      })
      const config = getConfig()
      expect(config).toEqual(jasmine.any(Object))
      expect(config.DB_HOST).toBe('localhost')
      expect(config.DB_PORT).toBe(5432)
      expect(config.DB_SSL).toBe(false)
    })

    it('should throw an error if an env var is missing', async () => {
      delete process.env.DB_HOST
      clearConfig()
      try {
        const { getConfig } = await esmock('../../src/config.js', {
          dotenv: {
            config: () => {}
          }
        })
        getConfig()
        throw new Error('Should have thrown ZodError')
      } catch (err: unknown) {
        expect(err).toEqual(jasmine.any(Error))
        expect((err as Error).message).toMatch('parsing environment')
      }
    })
  })

  describe('isDevelopment()', () => {
    it('should return true when NODE_ENV is "development"', async () => {
      const { isDevelopment } = await esmock('../../src/config.js', {
        dotenv: {
          config: () => {}
        },
        znv: {
          parseEnv: () => ({ NODE_ENV: 'development' })
        }
      })
      expect(isDevelopment()).toBeTrue()
    })

    it('should return false when NODE_ENV is not "development"', async () => {
      const { isDevelopment } = await esmock('../../src/config.js', {
        dotenv: {
          config: () => {}
        },
        znv: {
          parseEnv: () => ({ NODE_ENV: 'production' })
        }
      })
      expect(isDevelopment()).toBeFalse()
    })
  })
})
