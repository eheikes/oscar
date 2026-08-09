import { NextFunction, Request, Response } from 'express'
import openidConnect, { auth } from 'express-openid-connect'
import jwtDecode from 'jsonwebtoken'
import jwksRsa from 'jwks-rsa'
import { getConfig, isDevelopment, isTest } from './config.js'
import { AuthorizationError, JWTError } from './error.js'
import { getUserById } from './users.js'

declare module 'express-serve-static-core' {
  interface Request {
    user?: Record<string, unknown>
  }
}

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
  if ((isDevelopment() || isTest()) && req.cookies[sessionName] === mockSession) {
    req.oidc = JSON.parse(typeof req.cookies.oidc === 'string' ? req.cookies.oidc : '{}')
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

// JWKS client for JWT validation
let jwksClient: jwksRsa.JwksClient | null = null

const getJwksClient = (): jwksRsa.JwksClient => {
  if (jwksClient === null) {
    const config = getConfig()
    const auth0Domain =
      config.AUTH0_DOMAIN != null && config.AUTH0_DOMAIN.trim() !== ''
        ? config.AUTH0_DOMAIN
        : extractDomainFromOpenIdUrl(config.OPENID_URL)
    if (auth0Domain == null || auth0Domain.trim() === '') {
      throw new Error('AUTH0_DOMAIN not configured and cannot extract from OPENID_URL')
    }
    jwksClient = jwksRsa({
      cache: true,
      cacheMaxAge: 24 * 60 * 60 * 1000, // 24 hours
      jwksUri: `https://${auth0Domain}/.well-known/jwks.json`
    })
  }
  return jwksClient
}

const extractDomainFromOpenIdUrl = (url: string): string | null => {
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.hostname
  } catch {
    return null
  }
}

// Middleware: Validate JWT Bearer token in Authorization header
export const validateJWT = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  // Browser CORS preflight does not carry bearer tokens.
  if (req.method === 'OPTIONS') {
    return next()
  }

  // Skip auth validation for OpenID Connect routes
  if (req.path === '/login' || req.path === '/logout' || req.path === '/callback') {
    return next()
  }

  /* c8 ignore start -- not for production use */
  // Check if running in test/dev mode with mock session
  if ((isDevelopment() || isTest()) && req.cookies[sessionName] === mockSession) {
    // Extract user from oidc cookie if available
    if (typeof req.oidc?.user?.sub === 'string' && req.oidc.user.sub.length > 0) {
      req.user = {
        sub: req.oidc.user.sub,
        email: req.oidc.user.email
      }
    }
    return next()
  }

  // Check if running in test/dev mode with mock token header
  const mockTokenHeader = req.headers['mock-token']
  if (
    (isDevelopment() || isTest()) &&
    typeof mockTokenHeader === 'string' &&
    mockTokenHeader.trim() !== ''
  ) {
    const mockToken = mockTokenHeader
    try {
      // For testing, just parse without verification
      const decoded = jwtDecode.decode(mockToken, { complete: false })
      req.user = decoded as Record<string, unknown>
      return next()
    } catch {
      throw new JWTError('Invalid mock token')
    }
  }
  /* c8 ignore stop */

  const authHeader = req.get('authorization')
  if (authHeader == null || !authHeader.startsWith('Bearer ')) {
    throw new JWTError('Missing or invalid Authorization header')
  }

  const token = authHeader.slice('Bearer '.length)

  try {
    const decoded = jwtDecode.decode(token, { complete: true })
    if (decoded == null) {
      throw new JWTError('Failed to decode token')
    }

    const { header, payload } = decoded
    const config = getConfig()
    const auth0Domain =
      config.AUTH0_DOMAIN != null && config.AUTH0_DOMAIN.trim() !== ''
        ? config.AUTH0_DOMAIN
        : extractDomainFromOpenIdUrl(config.OPENID_URL)
    if (auth0Domain == null || auth0Domain.trim() === '') {
      throw new Error('AUTH0_DOMAIN not configured')
    }

    // Verify signature using JWKS
    const client = getJwksClient()
    const key = await client.getSigningKey(header.kid)
    const signingKey = key.getPublicKey()
    const audience = config.OPENID_AUDIENCE ?? config.OPENID_CLIENT_ID

    jwtDecode.verify(token, signingKey, {
      algorithms: ['RS256'],
      audience,
      issuer: `https://${auth0Domain}/`
    })

    // Token is valid, attach decoded payload to request
    req.user = payload as Record<string, unknown>
    next()
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === 'TokenExpiredError') {
        throw new JWTError('Token has expired')
      } else if (err.name === 'JsonWebTokenError' || err.name === 'NotBeforeError') {
        throw new JWTError(`Invalid token: ${err.message}`)
      }
    }
    throw new JWTError('Invalid token')
  }
}

// Middleware: Check if user is in allowed users list
export const checkAllowedUsers = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.method === 'OPTIONS') {
    return next()
  }

  // Skip auth validation for OpenID Connect routes
  if (req.path === '/login' || req.path === '/logout' || req.path === '/callback') {
    return next()
  }

  /* c8 ignore start -- not for production use */
  // Skip check in dev/test if using mock session
  if ((isDevelopment() || isTest()) && req.cookies[sessionName] === mockSession) {
    return next()
  }
  /* c8 ignore stop */

  const config = getConfig()
  if (config.ALLOWED_USERS == null || config.ALLOWED_USERS.trim() === '') {
    // If no whitelist configured, allow all authenticated users
    return next()
  }

  const allowedUsers = config.ALLOWED_USERS.split(',').map(u => u.trim()).filter(Boolean)
  const userSub = (req.user?.sub as string | undefined) ?? ''
  const userEmail = (req.user?.email as string | undefined) ?? ''
  const normalizedEmail = userEmail.toLowerCase()

  const isAllowed = allowedUsers.some(allowed =>
    userSub === allowed || normalizedEmail === allowed.toLowerCase()
  )

  if (!isAllowed) {
    const userIdentifier = userEmail !== '' ? userEmail : userSub
    throw new AuthorizationError(`User ${userIdentifier} is not in allowed users list`)
  }

  next()
}
