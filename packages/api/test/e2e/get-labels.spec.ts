import request from 'supertest'
import { describe, it, expect } from 'vitest'
import { app } from '../../src/app.js'

describe('GET /labels', () => {
  it('should return the labels', async () => {
    const response = await request(app)
      .get('/labels')
      .expect(200)

    expect(response.body).toEqual([
      { id: 'busywork', readable: 'busywork' },
      { id: 'important', readable: 'important' },
      { id: 'personal', readable: 'personal' },
      { id: 'trivial', readable: 'trivial' },
      { id: 'urgent', readable: 'urgent' },
      { id: 'work', readable: 'work' }
    ])
  })
})
