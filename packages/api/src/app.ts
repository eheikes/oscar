import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { checkAllowedUsers, configureAuth, validateJWT } from './auth.js'
import { isDevelopment } from './config.js'
import {
  addItemController,
  deleteItemController,
  getItemsController,
  getLabelsController,
  getNextItemController,
  getProfileController,
  getRetroItemsController,
  getTypesController,
  getWebpageController,
  updateItemController
} from './controllers.js'
import { migrateDatabase } from './database.js'
import { errorHandler, throw404 } from './error.js'
import { httpLogger } from './logger.js'

await migrateDatabase()

export const app = express()

app.use(httpLogger)

app.use(bodyParser.json())

app.set('x-powered-by', false)

app.use(cors({
  origin: '*'
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
app.delete('/items/:itemId', deleteItemController)
app.patch('/items/:itemId', updateItemController)
app.get('/items', getItemsController)
app.post('/items', addItemController)
app.get('/types', getTypesController)
app.get('/labels', getLabelsController)
app.get('/profile', getProfileController)
/* eslint-enable @typescript-eslint/no-misused-promises */

app.all('/*any', throw404)
app.use(errorHandler)
