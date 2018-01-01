import { opts } from '../src/main'

describe('main', () => {
  it('should parse the CLI arguments', () => {
    expect(opts).toEqual(jasmine.any(Object))
    expect(opts.$0).toMatch(/jasmine-ts$/)
  })
})