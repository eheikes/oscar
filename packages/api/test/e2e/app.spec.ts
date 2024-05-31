import request from 'supertest'
import { app } from '../../src/app.js'

describe('app', () => {
  it('should not include an x-powered-by header', async () => {
    const response = await request(app)
      .get('/')
    expect(response.headers['x-powered-by']).toBeUndefined()
  })
})
