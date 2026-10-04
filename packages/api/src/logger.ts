import type { Logger } from 'pino'
import pino from 'pino'
import { pinoHttp } from 'pino-http'
import pretty from 'pino-pretty'
import { isLocal, isTest } from './config.js'

const usePretty = isLocal() || isTest()

const stream = usePretty
  ? pretty({
    colorize: true,
    ignore: 'pid,hostname',
    translateTime: 'SYS:standard'
  })
  : undefined

const level = usePretty ? 'debug' : 'info'

// pino-http logs the request and response headers, so keep credentials out of the logs.
// Set on the base logger so that child loggers (e.g. req.log) inherit it.
const redactPaths = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]'
]

export const logger = stream === undefined
  ? pino({ level, redact: redactPaths })
  : pino({ level, redact: redactPaths }, stream)

export const httpLogger = pinoHttp({ logger })

/* eslint-disable @typescript-eslint/no-namespace -- extend Express.Request */
declare global {
  namespace Express {
    interface Request {
      log: Logger
    }
  }
}
