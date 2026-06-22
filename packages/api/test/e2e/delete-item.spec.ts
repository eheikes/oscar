import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { app } from '../../src/app.js'
import { getDatabaseConnection } from '../../src/database.js'

describe('DELETE /items/:itemId', () => {
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
    updated_at: new Date('2024-05-31T06:28:34.356Z'),
    deleted_at: new Date('2024-06-01T10:00:00.000Z')
  }

  beforeEach(async () => {
    await db('item_labels').delete()
    await db('items').delete()
    await db('items').insert(testItem1)
    await db('items').insert(testItem2)
  })

  it('should delete an item by ID', async () => {
    await request(app)
      .delete(`/items/${testItem1.id}`)
      .expect(204)
    const item = await db('items').where({ id: testItem1.id }).first()
    expect(item).toBeUndefined()
  })

  it('should delete an item that already has deleted_at set', async () => {
    await request(app)
      .delete(`/items/${testItem2.id}`)
      .expect(204)
    const item = await db('items').where({ id: testItem2.id }).first()
    expect(item).toBeUndefined()
  })

  it('should return 400 when a non-UUID is provided', async () => {
    await request(app)
      .delete('/items/invalid-uuid')
      .expect(400)
  })

  it('should return 404 when trying to delete a non-existent item', async () => {
    await request(app)
      .delete('/items/00000000-0000-0000-0000-000000000000')
      .expect(404)
  })

  it('should return 404 after the item has already been deleted', async () => {
    await request(app)
      .delete(`/items/${testItem1.id}`)
      .expect(204)
    await request(app)
      .delete(`/items/${testItem1.id}`)
      .expect(404)
  })
})
