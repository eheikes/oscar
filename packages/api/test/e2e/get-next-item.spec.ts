import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'
import { app } from '../../src/app.js'
import { getDatabaseConnection } from '../../src/database.js'

describe('GET /items/:typeId', () => {
  const db = getDatabaseConnection()
  const testItem1 = {
    id: 'bdb76fb4-98aa-4b48-bb9c-fc647199e09f',
    title: 'Item 1',
    uri: 'http://example.com',
    type_id: 'task',
    created_at: new Date('2024-05-31T06:28:47.753Z'),
    updated_at: new Date('2024-05-31T06:28:47.753Z')
  }
  const testItem2 = {
    id: '2400b74e-3d59-4fcc-9d5f-3a0ad46a2066',
    title: 'Item 2',
    uri: 'http://example.com/foo',
    type_id: 'task',
    created_at: new Date('2024-05-31T06:28:34.356Z'),
    updated_at: new Date('2024-05-31T06:28:34.356Z')
  }

  beforeAll(async () => {
    await db('item_labels').delete()
    await db('items').delete()
    await db('items').insert(testItem1)
    await db('item_labels').insert({ item_id: testItem1.id, label_id: 'work' })
    await db('items').insert(testItem2)
  })

  it('should return an item of a given type', async () => {
    await request(app)
      .get('/items/next?type=task')
      .expect(200)
      .then(response => {
        expect(response.body[0].item.id).toEqual(testItem1.id)
        expect(response.body[0].item.labels).toEqual(['work'])
        expect(response.body[0].reason).toEqual(expect.any(String))
      })
  })

  it('should return multiple items if requested', async () => {
    await request(app)
      .get('/items/next?type=task&count=2')
      .expect(200)
      .then(response => {
        expect(Array.isArray(response.body)).toBe(true)
        expect(response.body.length).toBe(2)
        expect(response.body[0].item.id).toEqual(testItem1.id)
        expect(response.body[0].item.labels).toEqual(['work'])
        expect(response.body[0].reason).toEqual(expect.any(String))
        expect(response.body[1].item.id).toEqual(testItem2.id)
        expect(response.body[1].item.labels).toEqual([])
        expect(response.body[1].reason).toEqual(expect.any(String))
      })
  })

  it('should return 404 when there is no item of the given type', async () => {
    await request(app)
      .get('/items/next?type=nonexistent')
      .expect(404)
  })

  it('should return 400 when given invalid params', async () => {
    await request(app)
      .get('/items/next')
      .expect(400)
      .then(response => {
        expect(response.body.error).toEqual(expect.any(String))
      })
  })
})
