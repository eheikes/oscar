import { beforeAll, describe, expect, it } from 'vitest'
import { app } from '../../src/app.js'
import { authedRequest } from './helpers/auth.js'
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
    await authedRequest(app).get('/items')
      .expect(200)
      .then(response => {
        expect(response.body.length).toBe(3)
        expect(response.body[0].id).toBe(testItem1.id)
        expect(response.body[1].id).toBe(testItem2.id)
        expect(response.body[2].id).toBe(testItem3.id)
      })
  })

  it('should filter by text search', async () => {
    await authedRequest(app).get('/items?search=item%202')
      .expect(200)
      .then(response => {
        expect(response.body.length).toBe(1)
        expect(response.body[0].id).toBe(testItem2.id)
      })
  })

  it('should filter by type (string)', async () => {
    await authedRequest(app).get('/items?type=read')
      .expect(200)
      .then(response => {
        expect(response.body.length).toBe(1)
        expect(response.body[0].id).toBe(testItem1.id)
      })
  })

  it('should filter by type (array)', async () => {
    await authedRequest(app).get('/items?type=read&type=watch')
      .expect(200)
      .then(response => {
        expect(response.body.length).toBe(2)
        expect(response.body.map((item: { id: string }) => item.id)).toEqual([testItem1.id, testItem2.id])
      })
  })

  it('should filter by label (string)', async () => {
    await authedRequest(app).get('/items?label=urgent')
      .expect(200)
      .then(response => {
        expect(response.body.length).toBe(1)
        expect(response.body[0].id).toBe(testItem1.id)
      })
  })

  it('should filter by label (array) requiring all labels', async () => {
    await authedRequest(app).get('/items?label=work&label=urgent')
      .expect(200)
      .then(response => {
        expect(response.body.length).toBe(1)
        expect(response.body[0].id).toBe(testItem1.id)
      })
  })

  it('should return 400 when given invalid params', async () => {
    await authedRequest(app).get('/items?orderDir=foo')
      .expect(400)
      .then(response => {
        expect(response.body.error).toEqual(expect.any(String))
      })
  })

  it('should return 400 when given an unknown query param', async () => {
    await authedRequest(app).get('/items?unknownParam=1')
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
    await authedRequest(app).get('/items')
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
    await authedRequest(app).get('/items?includeDeleted=true')
      .expect(200)
      .then(response => {
        expect(response.body).toContainEqual(expect.objectContaining({ id: deletedItemId }))
      })
  })

  it('should limit items by count', async () => {
    await authedRequest(app).get('/items?count=2')
      .expect(200)
      .then(response => {
        expect(response.body.length).toBe(2)
      })
  })

  describe('parent/child relations', () => {
    it("should include the parent's id and title even when the parent is excluded from the results", async () => {
      const parentId = 'cccccccc-0000-4000-8000-000000000001'
      const childId = 'cccccccc-0000-4000-8000-000000000002'
      await db('items').insert({
        id: parentId,
        title: 'Excluded Parent',
        type_id: 'read',
        created_at: new Date('2024-01-01T00:00:00.000Z'),
        updated_at: new Date('2024-01-01T00:00:00.000Z')
      })
      await db('items').insert({
        id: childId,
        title: 'Included Child',
        type_id: 'task',
        parent_id: parentId,
        created_at: new Date('2024-01-02T00:00:00.000Z'),
        updated_at: new Date('2024-01-02T00:00:00.000Z')
      })

      await authedRequest(app).get('/items?type=task')
        .expect(200)
        .then(response => {
          const ids = response.body.map((item: { id: string }) => item.id)
          expect(ids).not.toContain(parentId)
          expect(ids).toContain(childId)
          const child = response.body.find((item: { id: string }) => item.id === childId)
          expect(child.parent).toEqual({ id: parentId, title: 'Excluded Parent', deletedAt: null })
        })
    })

    it('should include children ids and titles even when the children are excluded from the results', async () => {
      const parentId = 'cccccccc-0000-4000-8000-000000000003'
      const childId = 'cccccccc-0000-4000-8000-000000000004'
      await db('items').insert({
        id: parentId,
        title: 'Included Parent',
        type_id: 'task',
        created_at: new Date('2024-01-01T00:00:00.000Z'),
        updated_at: new Date('2024-01-01T00:00:00.000Z')
      })
      await db('items').insert({
        id: childId,
        title: 'Excluded Child',
        type_id: 'read',
        parent_id: parentId,
        created_at: new Date('2024-01-02T00:00:00.000Z'),
        updated_at: new Date('2024-01-02T00:00:00.000Z')
      })

      await authedRequest(app).get('/items?type=task')
        .expect(200)
        .then(response => {
          const ids = response.body.map((item: { id: string }) => item.id)
          expect(ids).not.toContain(childId)
          expect(ids).toContain(parentId)
          const parent = response.body.find((item: { id: string }) => item.id === parentId)
          expect(parent.children).toEqual([{ id: childId, title: 'Excluded Child', deletedAt: null }])
        })
    })

    it('should mention a soft-deleted child even when deleted items are excluded from the results', async () => {
      const parentId = 'cccccccc-0000-4000-8000-000000000005'
      const childId = 'cccccccc-0000-4000-8000-000000000006'
      await db('items').insert({
        id: parentId,
        title: 'Parent With Deleted Child',
        type_id: 'task',
        created_at: new Date('2024-01-01T00:00:00.000Z'),
        updated_at: new Date('2024-01-01T00:00:00.000Z')
      })
      await db('items').insert({
        id: childId,
        title: 'Deleted Child',
        type_id: 'task',
        parent_id: parentId,
        deleted_at: new Date('2024-01-03T00:00:00.000Z'),
        created_at: new Date('2024-01-02T00:00:00.000Z'),
        updated_at: new Date('2024-01-02T00:00:00.000Z')
      })

      await authedRequest(app).get('/items')
        .expect(200)
        .then(response => {
          const ids = response.body.map((item: { id: string }) => item.id)
          expect(ids).not.toContain(childId)
          const parent = response.body.find((item: { id: string }) => item.id === parentId)
          expect(parent.children).toEqual([{ id: childId, title: 'Deleted Child', deletedAt: '2024-01-03T00:00:00.000Z' }])
        })
    })

    it('should return null parent and an empty children array when an item has no relations', async () => {
      await authedRequest(app).get('/items?type=watch')
        .expect(200)
        .then(response => {
          expect(response.body).toHaveLength(1)
          expect(response.body[0].parent).toBe(null)
          expect(response.body[0].children).toEqual([])
        })
    })
  })
})
