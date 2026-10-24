import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { rateLimit } from 'express-rate-limit'
import { checkAllowedUsers, configureAuth, validateJWT } from './auth.js'
import { getConfig, isDevelopment } from './config.js'
import {
  addItemController,
  deleteItemController,
  getItemController,
  getIntegrationsController,
  getItemsController,
  getLabelsController,
  getNextItemController,
  getProfileController,
  getRetroItemsController,
  getTypesController,
  getWebpageController,
  updateItemController
} from './controllers.js'
import { errorHandler, throw404 } from './error.js'
import { getEnabledIntegrations } from './integrations/index.js'
import { httpLogger, logger } from './logger.js'

const config = getConfig()
const integrations = getEnabledIntegrations() // throws on startup if an integration isn't configured

export const app = express()

app.use(rateLimit({
  windowMs: config.RATE_LIMITING_WINDOW,
  limit: config.RATE_LIMITING_MAX,
  standardHeaders: true, // return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // disable the `X-RateLimit-*` headers
  ipv6Subnet: config.RATE_LIMITING_IPV6_SUBNET,
  // API Gateway adds an X-Forwarded-For header, but serverless-http already sets the client IP
  // from the gateway's request context, so don't trust (or warn about) the header.
  validate: { xForwardedForHeader: false },
  logger: {
    // pino methods throw if called without their logger as `this`
    warn: logger.warn.bind(logger),
    error: logger.error.bind(logger)
  }
}))

app.use(httpLogger)

app.use(bodyParser.json())

app.set('x-powered-by', false)

app.use(cors({
  origin: config.CORS_ALLOWED_ORIGIN === '' ? false : config.CORS_ALLOWED_ORIGIN
}))
app.use(cookieParser())
/* eslint-disable @typescript-eslint/no-misused-promises -- async middleware is supported by Express v5 */
app.use(configureAuth) // adds /login, /logout, and /callback routes
app.use(validateJWT) // Validate JWT tokens for API requests
app.use(checkAllowedUsers) // Check if user is in allowed users list
/* eslint-enable @typescript-eslint/no-misused-promises */

/* eslint-disable @typescript-eslint/no-misused-promises -- async supported by Express v5 */
if (isDevelopment()) {
  app.get('/', getWebpageController)
}
app.get('/items/next', getNextItemController)
app.get('/items/retro', getRetroItemsController)
app.get('/items/:itemId', getItemController)
app.delete('/items/:itemId', deleteItemController)
app.patch('/items/:itemId', updateItemController)
app.get('/items', getItemsController)
app.post('/items', addItemController)
app.get('/types', getTypesController)
app.get('/labels', getLabelsController)
app.get('/profile', getProfileController)
app.get('/integrations', getIntegrationsController)
for (const integration of integrations) {
  app.use(`/integrations/${integration.id}`, integration.router)
}
/* eslint-enable @typescript-eslint/no-misused-promises */

app.all('/*any', throw404)
app.use(errorHandler)
