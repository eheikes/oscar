import express from 'express'
import { getItems } from './items.js'

export const app = express()

app.set('x-powered-by', false)

app.get('/items', async (req, res) => {
  const result = await getItems(req.query)
  res.json(result)
})
