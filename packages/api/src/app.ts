import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { checkAuthn, checkAuthz, configureAuth } from './auth.js'
import { isDevelopment } from './config.js'
import { getItemsController, getProfileController, getWebpageController } from './controllers.js'
import { errorHandler, throw404 } from './error.js'

export const app = express()

app.set('x-powered-by', false)

app.use(cors({
  origin: '*'
}))
app.use(cookieParser())
app.use(configureAuth) // adds /login, /logout, and /callback routes

/* eslint-disable @typescript-eslint/no-misused-promises -- async supported by Express v5 */
if (isDevelopment()) {
  app.get('/', getWebpageController)
}
app.get('/items', checkAuthn, checkAuthz, getItemsController)
app.get('/profile', checkAuthn, checkAuthz, getProfileController)
/* eslint-enable @typescript-eslint/no-misused-promises */

app.all('(.*)', throw404)
app.use(errorHandler)
