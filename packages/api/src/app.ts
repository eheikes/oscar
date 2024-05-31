import express from 'express'
import { getItems } from './items.js'

export const app = express()

app.set('x-powered-by', false)

app.get('/items', (req, res) => {
  void (async () => {
    const result = await getItems(req.query)
    res.json(result)
  })()
})
