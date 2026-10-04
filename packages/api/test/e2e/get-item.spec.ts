import { beforeEach, describe, expect, it } from 'vitest'
import { app } from '../../src/app.js'
import { authedRequest } from './helpers/auth.js'
import { getDatabaseConnection } from '../../src/database.js'

describe('GET /items/:itemId', () => {
  const db = getDatabaseConnection()
  const parentItem = {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    title: 'Parent Item',
    type_id: 'task',
    created_at: new Date('2024-05-31T06:28:47.753Z'),
    updated_at: new Date('2024-05-31T06:28:47.753Z')
  }
  const testItem = {
    id: 'bdb76fb4-98aa-4b48-bb9c-fc647199e09f',
    title: 'Item 1',
    uri: 'http://example.com',
    type_id: 'task',
    parent_id: parentItem.id,
    created_at: new Date('2024-05-31T06:28:47.753Z'),
    updated_at: new Date('2024-05-31T06:28:47.753Z')
  }
  const deletedItem = {
    id: '2400b74e-3d59-4fcc-9d5f-3a0ad46a2066',
    title: 'Item 2',
    type_id: 'task',
    created_at: new Date('2024-05-31T06:28:34.356Z'),
    updated_at: new Date('2024-05-31T06:28:34.356Z'),
    deleted_at: new Date('2024-06-01T10:00:00.000Z')
  }

  beforeEach(async () => {
    await db('item_labels').delete()
    await db('items').delete()
    await db('items').insert(parentItem)
    await db('items').insert(testItem)
    await db('items').insert(deletedItem)
    await db('item_labels').insert({ item_id: testItem.id, label_id: 'work' })
  })

  it('should return the item with labels and relations', async () => {
    const response = await authedRequest(app).get(`/items/${testItem.id}`)
      .expect(200)
    expect(response.body).toMatchObject({
      id: testItem.id,
      title: testItem.title,
      uri: testItem.uri,
      type: 'task',
      labels: ['work'],
      parentId: parentItem.id,
      parent: { id: parentItem.id, title: parentItem.title, deletedAt: null },
      children: []
    })
  })

  it('should include children of a parent item', async () => {
    const response = await authedRequest(app).get(`/items/${parentItem.id}`)
      .expect(200)
    expect(response.body.parent).toBeNull()
    expect(response.body.children).toEqual([
      { id: testItem.id, title: testItem.title, deletedAt: null }
    ])
  })

  it('should return a soft-deleted item', async () => {
    const response = await authedRequest(app).get(`/items/${deletedItem.id}`)
      .expect(200)
    expect(response.body.deletedAt).toBe(deletedItem.deleted_at.toISOString())
  })

  it('should return 400 when a non-UUID is provided', async () => {
    await authedRequest(app).get('/items/invalid-uuid')
      .expect(400)
  })

  it('should return 404 for a non-existent item', async () => {
    await authedRequest(app).get('/items/00000000-0000-0000-0000-000000000000')
      .expect(404)
  })
})
