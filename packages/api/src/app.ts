import express from 'express'
import { getItemsController } from './controllers.js'
import { errorHandler } from './error.js'

export const app = express()

app.set('x-powered-by', false)

app.get('/items', getItemsController)

app.use(errorHandler)
