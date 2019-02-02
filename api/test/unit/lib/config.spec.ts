import { getConfig } from '../../../src/lib/config'

describe('getConfig()', () => {
  it('should return the parsed configuration in the first call', () => {
    expect(getConfig().routes.length).toBeGreaterThan(0)
  })

  it('should return the parsed configuration in subsequent calls', () => {
    expect(getConfig().routes.length).toBeGreaterThan(0)
  })
})
