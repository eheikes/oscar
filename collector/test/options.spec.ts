import { allOptions, parseArguments } from '../src/options'

describe('options', () => {
  describe('allOptions', () => {
    it('should be defined', () => {
      expect(allOptions).toEqual(jasmine.any(Object))
    })
  })

  describe('parseArguments', () => {
    it('should parse an array of CLI arguments', () => {
      const actual = parseArguments(['--count', '7'])
      expect(actual.c).toBe(7)
      expect(actual.count).toBe(7)
    })

    it('should use the default options', () => {
      const actual = parseArguments([])
      expect(actual.c).toBe(allOptions.count.default)
      expect(actual.count).toBe(allOptions.count.default)
    })
  })
})
