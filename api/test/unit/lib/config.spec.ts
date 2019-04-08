import { getConfig, reset } from '../../../src/lib/config'
import { createTempDir } from '../../helpers/temp'

describe('getConfig()', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = createTempDir({
      'env': '.env',
      'config.yml': 'config.yml'
    })
  })

  afterEach(() => {
    reset()
  })

  it('should return the parsed configuration in the first call', () => {
    expect(getConfig(tempDir).routes.length).toBeGreaterThan(0)
  })

  it('should return the parsed configuration in subsequent calls', () => {
    getConfig(tempDir)
    expect(getConfig(tempDir).routes.length).toBeGreaterThan(0)
  })

  it('should include the env values', () => {
    expect(getConfig(tempDir).env).toEqual({
      foo: 'bar'
    })
  })

  it('should set env to {} if there is no .env file', () => {
    tempDir = createTempDir({
      'config.yml': 'config.yml'
    })
    expect(getConfig(tempDir).env).toEqual({})
  })
})
