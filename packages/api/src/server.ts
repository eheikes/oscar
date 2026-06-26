import { app } from './app.js'
import { logger } from './logger.js'

const port = process.env.PORT === undefined ? 8080 : parseInt(process.env.PORT, 10)

app.listen(port, () => {
  logger.info({ port }, 'App listening')
})
