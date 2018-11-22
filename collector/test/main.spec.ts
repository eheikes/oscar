import { sources } from '../src/database'
import { opts, getNextXSources } from '../src/main'

describe('main', () => {
  it('should parse the CLI arguments', () => {
    expect(opts).toEqual(jasmine.any(Object))
    expect(opts.$0).toMatch(/jasmine-ts/)
  })

  describe('getNextXSources()', () => {
    beforeEach(() => {
      spyOn(sources, 'find').and.returnValue(Promise.resolve())
    })
    it('should return the specified number of sources', async () => {
      await getNextXSources(42)
      expect(sources.find).toHaveBeenCalledWith({ limit: 42 })
    })
  })
})
