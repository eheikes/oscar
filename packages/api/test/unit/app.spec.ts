import esmock from 'esmock'
import { app as originalApp } from '../../src/app.js'

describe('app', () => {
  let app: typeof originalApp
  let expressGetSpy: jasmine.Spy
  let mockExpress: any

  beforeEach(async () => {
    expressGetSpy = jasmine.createSpy('express.get')
    mockExpress = {
      get: expressGetSpy
    }
    ;({ app } = await esmock('../../src/app.js', {
      express: () => mockExpress
    }))
  })

  it('should export an Express app', () => {
    expect(app).toBe(mockExpress)
  })

  it('should create the routes', () => {
    expect(expressGetSpy).toHaveBeenCalledWith('/', jasmine.any(Function))
  })
})
