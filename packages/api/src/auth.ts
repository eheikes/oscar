import { NextFunction, Request, Response } from 'express'
import openidConnect, { auth } from 'express-openid-connect'
import { getConfig, isDevelopment } from './config.js'

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

export const checkAuthn = (req: Request, res: Response, next: NextFunction): void => {
  if (isDevelopment() && req.cookies[sessionName] === mockSession) {
    return next()
  }
  openidConnect.requiresAuth()(req, res, next)
}

export const configureAuth = auth(authConfig)
