import request from 'supertest'
import { describe, it } from 'vitest'
import { app } from '../../src/app.js'

describe('GET /types', () => {
  it('should return the types', async () => {
    await request(app)
      .get('/types')
      .expect(200)
      .expect([
        {
          id: 'listen',
          readable: 'listen to'
        },
        {
          id: 'listen-passive',
          readable: 'passively listen to'
        },
        {
          id: 'news',
          readable: 'catch up on'
        },
        {
          id: 'play',
          readable: 'play'
        },
        {
          id: 'read',
          readable: 'read'
        },
        {
          id: 'task',
          readable: 'do'
        },
        {
          id: 'watch',
          readable: 'watch'
        },
        {
          id: 'watch-passive',
          readable: 'passively watch'
        }
      ])
  })
})
