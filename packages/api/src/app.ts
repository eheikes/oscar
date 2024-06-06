import express from 'express'
import { getItemsController } from './controllers.js'
import { errorHandler, throw404 } from './error.js'

export const app = express()

app.set('x-powered-by', false)

/* eslint-disable @typescript-eslint/no-misused-promises -- async supported by Express v5 */
app.get('/items', getItemsController)
/* eslint-enable @typescript-eslint/no-misused-promises */

app.all('(.*)', throw404)
app.use(errorHandler)
