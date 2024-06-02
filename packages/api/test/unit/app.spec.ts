import esmock from 'esmock'
import { app as originalApp } from '../../src/app.js'
import { getItemsController } from '../../src/controllers.js'
import { errorHandler } from '../../src/error.js'

describe('app', () => {
  let app: typeof originalApp
  let expressGetSpy: jasmine.Spy
  let expressSetSpy: jasmine.Spy
  let expressUseSpy: jasmine.Spy
  let mockExpress: any

  beforeEach(async () => {
    expressGetSpy = jasmine.createSpy('express.get')
    expressSetSpy = jasmine.createSpy('express.set')
    expressUseSpy = jasmine.createSpy('express.use')
    mockExpress = {
      get: expressGetSpy,
      set: expressSetSpy,
      use: expressUseSpy
    }
    ;({ app } = await esmock('../../src/app.js', {
      express: () => mockExpress
    }))
  })

  it('should export an Express app', () => {
    expect(app).toBe(mockExpress)
  })

  it('should turn off the X-Powered-By header', () => {
    expect(expressSetSpy).toHaveBeenCalledWith('x-powered-by', false)
  })

  it('should create the routes', () => {
    expect(expressGetSpy).toHaveBeenCalledWith('/items', getItemsController)
  })

  it('should use the error handler', () => {
    expect(expressUseSpy).toHaveBeenCalledWith(errorHandler)
  })
})
