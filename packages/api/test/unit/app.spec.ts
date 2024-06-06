import { Application } from 'express'
import esmock from 'esmock'
import { app as originalApp } from '../../src/app.js'
import { getItemsController } from '../../src/controllers.js'
import { errorHandler, throw404 } from '../../src/error.js'

describe('app', () => {
  let app: typeof originalApp
  let mockExpress: jasmine.SpyObj<Application>

  beforeEach(async () => {
    mockExpress = jasmine.createSpyObj('app', ['all', 'get', 'set', 'use'])
    ;({ app } = await esmock('../../src/app.js', {
      express: () => mockExpress
    }))
  })

  it('should export an Express app', () => {
    expect(app).toBe(mockExpress)
  })

  it('should turn off the X-Powered-By header', () => {
    expect(mockExpress.set).toHaveBeenCalledWith('x-powered-by', false)
  })

  it('should create the routes', () => {
    expect(mockExpress.get as any).toHaveBeenCalledWith('/items', getItemsController)
  })

  it('should throw an error if the request does not match any routes', () => {
    expect(mockExpress.all as any).toHaveBeenCalledWith('(.*)', throw404)
  })

  it('should use the error handler', () => {
    expect(mockExpress.use as any).toHaveBeenCalledWith(errorHandler)
  })
})
