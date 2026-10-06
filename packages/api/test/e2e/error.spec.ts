import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { errorHandler } from '../../src/error.js'
import { httpLogger } from '../../src/logger.js'

describe('errorHandler', () => {
  const app = express()
  app.use(httpLogger)
  app.get('/', () => {
    // Knex includes the query and its values in the error message.
    throw new Error('insert into "items" ("title") values (\'Secret Title\') - value too long')
  })
  app.use(errorHandler)

  it('should not reveal the details of unexpected errors', async () => {
    await request(app)
      .get('/')
      .expect(500)
      .then(response => {
        expect(response.body).toEqual({ error: 'Internal server error', requestId: expect.any(String) })
        expect(JSON.stringify(response.body)).not.toContain('Secret Title')
      })
  })
})
