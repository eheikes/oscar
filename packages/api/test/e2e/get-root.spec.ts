import request from 'supertest'
import { app } from '../../src/app.js'

describe('GET /', () => {
  it('should return a hello message', async () => {
    await request(app)
      .get(`/`)
      .expect(200)
      .expect({ message: 'Hello from Express on AWS Lambda!' })
  })
})
