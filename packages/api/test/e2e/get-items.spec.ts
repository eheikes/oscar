import request from 'supertest'
import { app } from '../../src/app.js'
import { mockSession, sessionName } from '../../src/auth.js'
import { getConfig } from '../../src/config.js'
import { getDatabaseConnection } from '../../src/database.js'

describe('GET /items', () => {
  const db = getDatabaseConnection()
  const testItem1 = {
    id: 'bdb76fb4-98aa-4b48-bb9c-fc647199e09f',
    title: 'Item 1',
    uri: 'http://example.com',
    type_id: 'read',
    created_at: '2024-05-31T06:28:47.753Z',
    updated_at: '2024-05-31T06:28:47.753Z'
  }
  const testItem2 = {
    id: '2400b74e-3d59-4fcc-9d5f-3a0ad46a2066',
    title: 'Item 2',
    uri: 'http://example.com/foo',
    type_id: 'watch',
    created_at: '2024-05-31T06:28:34.356Z',
    updated_at: '2024-05-31T06:28:34.356Z'
  }

  beforeAll(async () => {
    await db('items').delete()
    await db('items').insert(testItem1)
    await db('items').insert(testItem2)
  })

  it('should require authentication', async () => {
    const config = getConfig()
    await request(app)
      .get('/items')
      .expect(302)
      .expect('set-cookie', /.*/)
      .expect('location', new RegExp(config.OPENID_URL))
  })

  it('should return the items', async () => {
    await request(app)
      .get('/items')
      .set('cookie', `${sessionName}=${mockSession}`)
      .expect(200)
      .then(response => {
        expect(response.body.length).toBe(2)
        expect(response.body[0].id).toBe(testItem1.id)
        expect(response.body[1].id).toBe(testItem2.id)
      })
  })

  it('should filter by text search', async () => {
    await request(app)
      .get('/items?search=item%202')
      .set('cookie', `${sessionName}=${mockSession}`)
      .expect(200)
      .then(response => {
        expect(response.body.length).toBe(1)
        expect(response.body[0].id).toBe(testItem2.id)
      })
  })

  it('should filter by type (string)', async () => {
    await request(app)
      .get('/items?type=read')
      .set('cookie', `${sessionName}=${mockSession}`)
      .expect(200)
      .then(response => {
        expect(response.body.length).toBe(1)
        expect(response.body[0].id).toBe(testItem1.id)
      })
  })

  it('should filter by type (array)', async () => {
    await request(app)
      .get('/items?type[]=read&type[]=watch')
      .set('cookie', `${sessionName}=${mockSession}`)
      .expect(200)
      .then(response => {
        expect(response.body.length).toBe(2)
        expect(response.body[0].id).toBe(testItem1.id)
        expect(response.body[1].id).toBe(testItem2.id)
      })
  })

  it('should return 400 when given invalid params', async () => {
    await request(app)
      .get('/items?orderDir=foo')
      .set('cookie', `${sessionName}=${mockSession}`)
      .expect(400)
      .then(response => {
        expect(response.body.error).toEqual(jasmine.any(String))
      })
  })
})
