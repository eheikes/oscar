import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'
import { app } from '../../src/app.js'
import { getDatabaseConnection } from '../../src/database.js'

describe('GET /items', () => {
  const db = getDatabaseConnection()
  const testItem1 = {
    id: 'bdb76fb4-98aa-4b48-bb9c-fc647199e09f',
    title: 'Item 1',
    uri: 'http://example.com',
    type_id: 'read',
    created_at: new Date('2024-05-31T06:28:47.753Z'),
    updated_at: new Date('2024-05-31T06:28:47.753Z'),
    deleted_at: null,
    author: null,
    due: new Date('2024-06-01T10:00:00.000Z'),
    expected_rank: null,
    image_uri: null,
    language: null,
    length: null,
    rank: null,
    rating: null,
    summary: null
  }
  const testItem2 = {
    id: '2400b74e-3d59-4fcc-9d5f-3a0ad46a2066',
    title: 'Item 2',
    uri: 'http://example.com/foo',
    type_id: 'watch',
    created_at: new Date('2024-05-31T06:28:34.356Z'),
    updated_at: new Date('2024-05-31T06:28:34.356Z'),
    deleted_at: null,
    author: null,
    due: new Date('2024-06-10T14:30:00.000Z'),
    expected_rank: null,
    image_uri: null,
    language: null,
    length: null,
    rank: null,
    rating: null,
    summary: null
  }
  const testItem3 = {
    id: '33333333-3333-4333-8333-333333333333',
    title: 'Item 3',
    uri: 'http://example.com/bar',
    type_id: 'task',
    created_at: new Date('2024-05-31T06:28:30.000Z'),
    updated_at: new Date('2024-05-31T06:28:30.000Z'),
    deleted_at: null,
    author: null,
    due: new Date('2024-06-20T09:00:00.000Z'),
    expected_rank: null,
    image_uri: null,
    language: null,
    length: null,
    rank: null,
    rating: null,
    summary: null
  }

  beforeAll(async () => {
    await db('item_labels').delete()
    await db('items').delete()
    await db('items').insert(testItem1)
    await db('items').insert(testItem2)
    await db('items').insert(testItem3)
    await db('item_labels').insert({ item_id: testItem1.id, label_id: 'work' })
    await db('item_labels').insert({ item_id: testItem1.id, label_id: 'urgent' })
    await db('item_labels').insert({ item_id: testItem2.id, label_id: 'work' })
    await db('item_labels').insert({ item_id: testItem3.id, label_id: 'personal' })
  })

  it('should return the items', async () => {
    await request(app)
      .get('/items')
      .expect(200)
      .then(response => {
        expect(response.body.length).toBe(3)
        expect(response.body[0].id).toBe(testItem1.id)
        expect(response.body[1].id).toBe(testItem2.id)
        expect(response.body[2].id).toBe(testItem3.id)
      })
  })

  it('should filter by text search', async () => {
    await request(app)
      .get('/items?search=item%202')
      .expect(200)
      .then(response => {
        expect(response.body.length).toBe(1)
        expect(response.body[0].id).toBe(testItem2.id)
      })
  })

  it('should filter by type (string)', async () => {
    await request(app)
      .get('/items?type=read')
      .expect(200)
      .then(response => {
        expect(response.body.length).toBe(1)
        expect(response.body[0].id).toBe(testItem1.id)
      })
  })

  it('should filter by type (array)', async () => {
    await request(app)
      .get('/items?type=read&type=watch')
      .expect(200)
      .then(response => {
        expect(response.body.length).toBe(2)
        expect(response.body.map((item: { id: string }) => item.id)).toEqual([testItem1.id, testItem2.id])
      })
  })

  it('should filter by label (string)', async () => {
    await request(app)
      .get('/items?label=urgent')
      .expect(200)
      .then(response => {
        expect(response.body.length).toBe(1)
        expect(response.body[0].id).toBe(testItem1.id)
      })
  })

  it('should filter by label (array) requiring all labels', async () => {
    await request(app)
      .get('/items?label=work&label=urgent')
      .expect(200)
      .then(response => {
        expect(response.body.length).toBe(1)
        expect(response.body[0].id).toBe(testItem1.id)
      })
  })

  it('should return 400 when given invalid params', async () => {
    await request(app)
      .get('/items?orderDir=foo')
      .expect(400)
      .then(response => {
        expect(response.body.error).toEqual(expect.any(String))
      })
  })

  it('should exclude deleted items by default', async () => {
    const deletedItemId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    await db('items').insert({
      ...testItem1,
      id: deletedItemId,
      title: 'Deleted Item',
      deleted_at: new Date()
    })
    await request(app)
      .get('/items')
      .expect(200)
      .then(response => {
        expect(response.body).not.toContainEqual(expect.objectContaining({ id: deletedItemId }))
      })
  })

  it('should include deleted items when includeDeleted is true', async () => {
    const deletedItemId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
    await db('items').insert({
      ...testItem1,
      id: deletedItemId,
      title: 'Another Deleted Item',
      deleted_at: new Date()
    })
    await request(app)
      .get('/items?includeDeleted=true')
      .expect(200)
      .then(response => {
        expect(response.body).toContainEqual(expect.objectContaining({ id: deletedItemId }))
      })
  })
})
