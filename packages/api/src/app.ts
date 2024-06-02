import express from 'express'
import { errorHandler } from './error.js'
import { getItems } from './items.js'

export const app = express()

app.set('x-powered-by', false)

app.get('/items', (req, res, next) => {
  void (async () => {
    try {
      const result = await getItems(req.query)
      res.json(result)
    } catch (err) {
      next(err)
    }
  })()
})

app.use(errorHandler)
