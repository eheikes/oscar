import express from 'express'

export const app = express()

app.set('x-powered-by', false)

app.get('/', (_req, res) => {
  res.json({ message: 'Hello from Express on AWS Lambda!' })
})
