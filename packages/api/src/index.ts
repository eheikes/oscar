import express from 'express'
import serverless from 'serverless-http'

const app = express()

app.get('/', (_req, res) => {
  res.json({ message: 'Hello from Express on AWS Lambda!' });
});

export const handler = serverless(app);
