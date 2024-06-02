import express from 'express'
import { getItemsController } from './controllers.js'
import { errorHandler } from './error.js'

export const app = express()

app.set('x-powered-by', false)

/* eslint-disable @typescript-eslint/no-misused-promises -- async supported by Express v5 */
app.get('/items', getItemsController)
/* eslint-enable @typescript-eslint/no-misused-promises */

app.use(errorHandler)
