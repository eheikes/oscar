import esmock from 'esmock'
import { Request, Response } from 'express'
import { configureAuth, mockSession, sessionName } from '../../src/auth.js'
import { getConfig } from '../../src/config.js'

describe('auth', () => {
  describe('configureAuth()', () => {
    it('should be a function', () => {
      expect(configureAuth).toEqual(jasmine.any(Function))
    })

    it('should call auth() from express-openid-connect with the config', async () => {
      const config = getConfig()
      const authSpy = jasmine.createSpy('auth')
      await esmock('../../src/auth.js', {
        'express-openid-connect': {
          auth: authSpy
        }
      })
      expect(authSpy).toHaveBeenCalled()
      expect(authSpy.calls.mostRecent().args[0].baseURL).toBe(config.APP_URL)
    })
  })

  describe('checkAuthn()', () => {
    it('should call the requiresAuth() function from express-openid-connect', async () => {
      const openidConnectSpy = jasmine.createSpyObj('express-openid-connect', ['auth', 'requiresAuth'])
      openidConnectSpy.requiresAuth.and.returnValue(() => {})
      const req: Request = { cookies: {} } as any
      const res: Response = {} as any
      const { checkAuthn } = await esmock('../../src/auth.js', {
        'express-openid-connect': openidConnectSpy
      })
      checkAuthn(req, res, () => {})
      expect(openidConnectSpy.requiresAuth).toHaveBeenCalled()
    })

    it('should skip to the next middleware for mocked sessions', async () => {
      const openidConnectSpy = jasmine.createSpyObj('express-openid-connect', ['auth', 'requiresAuth'])
      const nextSpy = jasmine.createSpy('next')
      const req: Request = { cookies: { [sessionName]: mockSession } } as any
      const res: Response = {} as any
      const { checkAuthn } = await esmock('../../src/auth.js', {
        'express-openid-connect': openidConnectSpy
      })
      checkAuthn(req, res, nextSpy)
      expect(nextSpy).toHaveBeenCalled()
      expect(openidConnectSpy.requiresAuth).not.toHaveBeenCalled()
    })
  })
})
