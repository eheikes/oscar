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

export const logger = stream === undefined
  ? pino({ level })
  : pino({ level }, stream)

export const httpLogger = pinoHttp({ logger })

/* eslint-disable @typescript-eslint/no-namespace -- extend Express.Request */
declare global {
  namespace Express {
    interface Request {
      log: Logger
    }
  }
}
