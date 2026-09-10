import { describe, expect, it } from 'vitest'
import { app } from '../../src/app.js'
import { authedRequest } from './helpers/auth.js'

describe('app', () => {
  it('should not include an x-powered-by header', async () => {
    const response = await authedRequest(app).get('/')
    expect(response.headers['x-powered-by']).toBeUndefined()
  })

  it('should return a 404 for invalid routes', async () => {
    await authedRequest(app).get('/foo')
      .expect(404)
  })
})
