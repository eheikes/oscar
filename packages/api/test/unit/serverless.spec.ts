import esmock from 'esmock'
import { handler as originalHandler } from '../../src/serverless.js'

describe('serverless', () => {
  let handler: typeof originalHandler
  let mockApp: any
  let mockServerless: any
  let serverlessSpy: jasmine.Spy

  beforeEach(async () => {
    mockApp = { name: 'mock Express app' }
    mockServerless = { name: 'mock Serverless app' }
    serverlessSpy = jasmine.createSpy('serverless-http').and.returnValue(mockServerless)
    ;({ handler } = await esmock('../../src/serverless.js', {
      'serverless-http': serverlessSpy,
      '../../src/app.js': {
        app: mockApp
      }
    }))
  })

  it('should export a Serverless app', () => {
    expect(handler).toBe(mockServerless)
  })

  it('should construct from the Express app', () => {
    expect(serverlessSpy).toHaveBeenCalledWith(mockApp)
  })
})
