import esmock from 'esmock'
import { setEnvVars } from '../helpers/env.js'

describe('config', () => {
  beforeEach(() => {
    setEnvVars()
  })

  it('should return the config', async () => {
    const { config } = await esmock('../../src/config.js')
    expect(config).toEqual(jasmine.any(Object))
    expect(config.DB_HOST).toBe('localhost')
    expect(config.DB_PORT).toBe(5432)
    expect(config.DB_SSL).toBe(true)
  })

  it('should throw an error if an env var is missing', async () => {
    delete process.env.DB_HOST
    try {
      await esmock('../../src/config.js')
      throw new Error('Should have thrown ZodError')
    } catch (err: unknown) {
      expect(err).toEqual(jasmine.any(Error))
      expect((err as Error).message).toMatch('parsing environment')
    }
  })
})
