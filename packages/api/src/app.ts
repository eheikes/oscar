import express from 'express'
import { errorHandler } from './error.js'
import { getItems } from './items.js'

export const app = express()

app.set('x-powered-by', false)

app.get('/items', async (req, res, _next) => {
  const result = await getItems(req.query)
  res.json(result)
})

app.use(errorHandler)
