import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { app } from '../../src/app.js'
import { getDatabaseConnection } from '../../src/database.js'

describe('PATCH /items/:itemId', () => {
  const db = getDatabaseConnection()
  const testItem = {
    id: 'bdb76fb4-98aa-4b48-bb9c-fc647199e09f',
    title: 'Test Item',
    type_id: 'task',
    uri: 'http://example.com',
    author: null,
    due: null,
    expected_rank: null,
    image_uri: null,
    language: null,
    length: null,
    rank: null,
    rating: null,
    summary: null,
    created_at: new Date('2024-05-31T06:28:47.753Z'),
    updated_at: new Date('2024-05-31T06:28:47.753Z'),
    deleted_at: null
  }
  const deletedItem = {
    id: '2400b74e-3d59-4fcc-9d5f-3a0ad46a2066',
    title: 'Deleted Item',
    type_id: 'task',
    created_at: new Date('2024-05-31T06:28:34.356Z'),
    updated_at: new Date('2024-05-31T06:28:34.356Z'),
    deleted_at: new Date('2024-06-01T10:00:00.000Z')
  }

  beforeEach(async () => {
    await db('item_labels').delete()
    await db('items').delete()
    await db('items').insert(testItem)
    await db('items').insert(deletedItem)
  })

  it('should return 200 with the updated item in the response body', async () => {
    await request(app)
      .patch(`/items/${testItem.id}`)
      .send({ title: 'Updated Item', author: 'Jane Doe' })
      .expect(200)
      .then(response => {
        expect(response.body.id).toBe(testItem.id)
        expect(response.body.title).toBe('Updated Item')
        expect(response.body.author).toBe('Jane Doe')
        expect(response.body.type).toBe('task')
        expect(response.body.createdAt).toBe(new Date(testItem.created_at).toISOString())
        expect(response.body.updatedAt).not.toBe(new Date(testItem.updated_at).toISOString())
        expect(response.body.deletedAt).toBe(null)
        expect(response.body.labels).toEqual([])
      })
  })

  it('should update the item in the database', async () => {
    await request(app)
      .patch(`/items/${testItem.id}`)
      .send({ title: 'Updated Item' })
      .expect(200)
    const row = await db('items').where({ id: testItem.id }).first()
    expect(row?.title).toBe('Updated Item')
    expect(row?.updated_at).not.toEqual(testItem.updated_at)
  })

  it('should only update the provided fields', async () => {
    await request(app)
      .patch(`/items/${testItem.id}`)
      .send({ author: 'New Author' })
      .expect(200)
      .then(response => {
        expect(response.body.title).toBe(testItem.title)
        expect(response.body.author).toBe('New Author')
        expect(response.body.type).toBe(testItem.type_id)
      })
  })

  it('should accept null for nullable fields', async () => {
    await db('items').update({ author: 'Some Author', language: 'en' }).where({ id: testItem.id })
    await request(app)
      .patch(`/items/${testItem.id}`)
      .send({ author: null, language: null })
      .expect(200)
      .then(response => {
        expect(response.body.author).toBe(null)
        expect(response.body.language).toBe(null)
      })
  })

  it('should replace labels when labels is provided', async () => {
    await db('item_labels').insert({ item_id: testItem.id, label_id: 'work' })
    await request(app)
      .patch(`/items/${testItem.id}`)
      .send({ labels: ['busywork', 'urgent'] })
      .expect(200)
      .then(response => {
        expect(response.body.labels).toEqual(['busywork', 'urgent'])
      })
    const labels = await db('item_labels').where({ item_id: testItem.id })
    expect(labels.map(l => l.label_id)).toEqual(['busywork', 'urgent'])
  })

  it('should not change labels when labels is not provided', async () => {
    await db('item_labels').insert({ item_id: testItem.id, label_id: 'personal' })
    await request(app)
      .patch(`/items/${testItem.id}`)
      .send({ title: 'Updated Title' })
      .expect(200)
    const labels = await db('item_labels').where({ item_id: testItem.id })
    expect(labels.map(l => l.label_id)).toEqual(['personal'])
  })

  it('should clear labels when an empty labels array is provided', async () => {
    await db('item_labels').insert({ item_id: testItem.id, label_id: 'important' })
    await request(app)
      .patch(`/items/${testItem.id}`)
      .send({ labels: [] })
      .expect(200)
      .then(response => {
        expect(response.body.labels).toEqual([])
      })
    const labels = await db('item_labels').where({ item_id: testItem.id })
    expect(labels).toHaveLength(0)
  })

  it('should return 400 when "id" is included in the body', async () => {
    await request(app)
      .patch(`/items/${testItem.id}`)
      .send({ id: '00000000-0000-0000-0000-000000000000' })
      .expect(400)
  })

  it('should return 400 when "createdAt" is included in the body', async () => {
    await request(app)
      .patch(`/items/${testItem.id}`)
      .send({ createdAt: '2024-01-01T00:00:00.000Z' })
      .expect(400)
  })

  it('should return 400 when "updatedAt" is included in the body', async () => {
    await request(app)
      .patch(`/items/${testItem.id}`)
      .send({ updatedAt: '2024-01-01T00:00:00.000Z' })
      .expect(400)
  })

  it('should allow setting deletedAt to an ISO 8601 value', async () => {
    await request(app)
      .patch(`/items/${testItem.id}`)
      .send({ deletedAt: '2024-01-01T00:00:00.000Z' })
      .expect(200)
      .then(response => {
        expect(response.body.deletedAt).toBe('2024-01-01T00:00:00.000Z')
      })
    const row = await db('items').where({ id: testItem.id }).first()
    expect(row?.deleted_at?.toISOString()).toBe('2024-01-01T00:00:00.000Z')
  })

  it('should allow setting deletedAt to null', async () => {
    await db('items').update({ deleted_at: new Date('2024-06-01T10:00:00.000Z') }).where({ id: testItem.id })
    await request(app)
      .patch(`/items/${testItem.id}`)
      .send({ deletedAt: null })
      .expect(200)
      .then(response => {
        expect(response.body.deletedAt).toBe(null)
      })
    const row = await db('items').where({ id: testItem.id }).first()
    expect(row?.deleted_at).toBe(null)
  })

  it('should return 400 when a non-UUID is provided for itemId', async () => {
    await request(app)
      .patch('/items/not-a-uuid')
      .send({ title: 'Updated' })
      .expect(400)
  })

  it('should return 404 when the item does not exist', async () => {
    await request(app)
      .patch('/items/00000000-0000-0000-0000-000000000000')
      .send({ title: 'Updated' })
      .expect(404)
  })

  it('should update a previously soft-deleted item', async () => {
    await request(app)
      .patch(`/items/${deletedItem.id}`)
      .send({ title: 'Updated' })
      .expect(200)
      .then(response => {
        expect(response.body.title).toBe('Updated')
      })
  })
})
