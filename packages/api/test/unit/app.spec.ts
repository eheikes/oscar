import { Express } from 'express'
import esmock from 'esmock'
import { app as originalApp } from '../../src/app.js'
import { configureAuth } from '../../src/auth.js'
import { getItemsController, getProfileController, getWebpageController } from '../../src/controllers.js'
import { errorHandler, throw404 } from '../../src/error.js'

describe('app', () => {
  let app: typeof originalApp
  let mockExpress: jasmine.SpyObj<Express>
  let cookieParserSpy: jasmine.Spy

  beforeEach(async () => {
    mockExpress = jasmine.createSpyObj('app', ['all', 'get', 'set', 'use'])
    cookieParserSpy = jasmine.createSpy('cookie-parser')
    ;({ app } = await esmock('../../src/app.js', {
      'cookie-parser': cookieParserSpy,
      express: () => mockExpress,
      '../../src/config.js': {
        isDevelopment: () => true
      }
    }))
  })

  it('should export an Express app', () => {
    expect(app).toBe(mockExpress)
  })

  it('should turn off the X-Powered-By header', () => {
    expect(mockExpress.set).toHaveBeenCalledWith('x-powered-by', false)
  })

  it('should add cookie parsing middleware', () => {
    expect(cookieParserSpy).toHaveBeenCalled()
  })

  it('should configure the authentication middleware', () => {
    expect(mockExpress.use as any).toHaveBeenCalledWith(configureAuth)
  })

  it('should create the routes', () => {
    expect(mockExpress.get as any).toHaveBeenCalledWith('/', getWebpageController)
    expect(mockExpress.get as any).toHaveBeenCalledWith(
      '/items',
      jasmine.any(Function),
      jasmine.any(Function),
      getItemsController
    )
    expect(mockExpress.get as any).toHaveBeenCalledWith(
      '/profile',
      jasmine.any(Function),
      jasmine.any(Function),
      getProfileController
    )
  })

  it('should throw an error if the request does not match any routes', () => {
    expect(mockExpress.all as any).toHaveBeenCalledWith('(.*)', throw404)
  })

  it('should use the error handler', () => {
    expect(mockExpress.use as any).toHaveBeenCalledWith(errorHandler)
  })
})
