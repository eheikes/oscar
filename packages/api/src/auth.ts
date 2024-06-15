import { NextFunction, Request, Response } from 'express'
import openidConnect, { auth } from 'express-openid-connect'
import { getConfig, isDevelopment } from './config.js'
import { AuthorizationError } from './error.js'
import { getUserById } from './users.js'

export const sessionName = 'appSession'
export const mockSession = 'mock_session_data' // for testing

const config = getConfig()

const authConfig = {
  authRequired: false,
  auth0Logout: true,
  baseURL: config.APP_URL,
  clientID: config.OPENID_CLIENT_ID,
  clientSecret: config.OPENID_CLIENT_SECRET,
  issuerBaseURL: config.OPENID_URL,
  secret: config.ENCRYPTION_KEY
}
export const configureAuth = auth(authConfig)

export const checkAuthn = (req: Request, res: Response, next: NextFunction): void => {
  /* c8 ignore start -- not for production use */
  if (isDevelopment() && req.cookies[sessionName] === mockSession) {
    req.oidc = JSON.parse(typeof req.cookies.oidc === 'object' ? req.cookies.oidc : '{}')
    return next()
  }
  /* c8 ignore stop */
  openidConnect.requiresAuth()(req, res, next)
}

export const checkAuthz = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const user = await getUserById(req.oidc?.user?.sub)
  if (user === null) {
    throw new AuthorizationError('User is not authorized for access')
  }
  next()
}
