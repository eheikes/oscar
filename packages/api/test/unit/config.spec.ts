import esmock from 'esmock'

describe('getConfig()', () => {
  it('should return the config', async () => {
    const { getConfig } = await esmock('../../src/config.js')
    const config = getConfig()
    expect(config).toEqual(jasmine.any(Object))
    expect(config.DB_HOST).toBe('localhost')
    expect(config.DB_PORT).toBe(5432)
    expect(config.DB_SSL).toBe(false)
  })

  it('should throw an error if an env var is missing', async () => {
    delete process.env.DB_HOST
    try {
      const { getConfig } = await esmock('../../src/config.js')
      getConfig()
      throw new Error('Should have thrown ZodError')
    } catch (err: unknown) {
      expect(err).toEqual(jasmine.any(Error))
      expect((err as Error).message).toMatch('parsing environment')
    }
  })
})
