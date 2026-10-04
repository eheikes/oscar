import express from 'express'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import { httpLogger } from '../../src/logger.js'

// In tests, the logger writes to a pino-pretty stream. Swap it for one that captures the raw output.
const output = vi.hoisted(() => ({ text: '' }))
vi.mock('pino-pretty', async () => {
  const { Writable } = await import('node:stream')
  return {
    default: () => new Writable({
      write (chunk, _encoding, callback) {
        output.text += String(chunk)
        callback()
      }
    })
  }
})

const getLogEntries = (): Array<Record<string, any>> => {
  return output.text.split('\n').filter(Boolean).map(line => JSON.parse(line))
}

describe('logger', () => {
  const app = express()
  app.use(httpLogger)
  app.get('/', (req, res) => {
    req.log.info('handler log')
    res.cookie('session', 'secret-response-cookie').send('ok')
  })

  it('should redact credentials from the logs', async () => {
    await request(app)
      .get('/')
      .set('Authorization', 'Bearer secret-access-token')
      .set('Cookie', 'session=secret-request-cookie')
      .expect(200)
    await vi.waitFor(() => {
      expect(output.text).toContain('request completed')
    })

    const entries = getLogEntries()
    const handlerEntry = entries.find(entry => entry.msg === 'handler log')
    expect(handlerEntry?.req.headers.authorization).toBe('[Redacted]')
    expect(handlerEntry?.req.headers.cookie).toBe('[Redacted]')
    const completedEntry = entries.find(entry => entry.msg === 'request completed')
    expect(completedEntry?.req.headers.authorization).toBe('[Redacted]')
    expect(completedEntry?.req.headers.cookie).toBe('[Redacted]')
    expect(completedEntry?.res.headers['set-cookie']).toBe('[Redacted]')

    expect(output.text).not.toContain('secret-access-token')
    expect(output.text).not.toContain('secret-request-cookie')
    expect(output.text).not.toContain('secret-response-cookie')
  })
})
