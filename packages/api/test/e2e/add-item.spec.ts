import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { app } from '../../src/app.js'
import { getDatabaseConnection } from '../../src/database.js'

describe('POST /items', () => {
  const db = getDatabaseConnection()

  beforeEach(async () => {
    await db('item_labels').delete()
    await db('items').delete()
  })

  it('should add the item to the database', async () => {
    await request(app)
      .post('/items')
      .send({
        author: 'John Doe',
        due: '2024-06-01T10:00:00.000Z',
        expectedRank: 1,
        imageUri: 'http://example.com/image.jpg',
        labels: ['work', 'urgent'],
        language: 'en',
        length: 100,
        rank: 5,
        rating: 4.5,
        summary: 'This is a summary.',
        title: 'New Item',
        uri: 'http://example.com',
        type: 'task'
      })
      .expect(201)
    const item = await db('items').first()
    expect(item?.author).toBe('John Doe')
    expect(item?.created_at).toEqual(expect.any(Date))
    expect(item?.deleted_at).toBe(null)
    expect(new Date(item?.due ?? 0).toISOString()).toBe('2024-06-01T10:00:00.000Z')
    expect(item?.expected_rank).toBe('1.0')
    expect(item?.id).toEqual(expect.any(String))
    expect(item?.image_uri).toBe('http://example.com/image.jpg')
    expect(item?.language).toBe('en')
    expect(item?.length).toBe(100)
    expect(item?.rank).toBe('5.0')
    expect(item?.rating).toBe('4.50')
    expect(item?.summary).toBe('This is a summary.')
    expect(item?.title).toBe('New Item')
    expect(item?.type_id).toBe('task')
    expect(item?.updated_at).toEqual(expect.any(Date))
    expect(item?.uri).toBe('http://example.com')
    const labels = await db('item_labels').where({ item_id: item?.id })
    expect(labels).toHaveLength(2)
    expect(labels.map(l => l.label_id)).toEqual(['work', 'urgent'])
  })

  it('should return the new item in the response body', async () => {
    await request(app)
      .post('/items')
      .send({
        author: 'John Doe',
        due: '2024-06-01T10:00:00.000Z',
        expectedRank: 1,
        imageUri: 'http://example.com/image.jpg',
        labels: ['work', 'urgent'],
        language: 'en',
        length: 100,
        rank: 5,
        rating: 4.5,
        summary: 'This is a summary.',
        title: 'New Item',
        uri: 'http://example.com',
        type: 'task'
      })
      .expect(201)
      .then(response => {
        expect(response.body.author).toBe('John Doe')
        expect(response.body.createdAt).toEqual(expect.any(String))
        expect(response.body.deletedAt).toBe(null)
        expect(new Date(response.body.due).toISOString()).toBe('2024-06-01T10:00:00.000Z')
        expect(response.body.expectedRank).toBe(1)
        expect(response.body.id).toEqual(expect.any(String))
        expect(response.body.imageUri).toBe('http://example.com/image.jpg')
        expect(response.body.labels).toEqual(['work', 'urgent'])
        expect(response.body.language).toBe('en')
        expect(response.body.length).toBe(100)
        expect(response.body.rank).toBe(5)
        expect(response.body.rating).toBe(4.5)
        expect(response.body.summary).toBe('This is a summary.')
        expect(response.body.title).toBe('New Item')
        expect(response.body.type).toBe('task')
        expect(response.body.updatedAt).toEqual(expect.any(String))
        expect(response.body.uri).toBe('http://example.com')
      })
  })

  it('should use null or empty values for optional fields', async () => {
    await request(app)
      .post('/items')
      .send({
        title: 'New Item',
        type: 'task'
      })
      .expect(201)
      .then(response => {
        expect(response.body.author).toBe(null)
        expect(response.body.deletedAt).toBe(null)
        expect(response.body.due).toBe(null)
        expect(response.body.expectedRank).toBe(null)
        expect(response.body.imageUri).toBe(null)
        expect(response.body.labels).toEqual([])
        expect(response.body.language).toBe(null)
        expect(response.body.length).toBe(null)
        expect(response.body.parentId).toBe(null)
        expect(response.body.rank).toBe(null)
        expect(response.body.rating).toBe(null)
        expect(response.body.summary).toBe(null)
        expect(response.body.uri).toBe(null)
      })
  })

  it('should allow creating an item with a valid parentId', async () => {
    const parentId = 'd8d84ccf-0540-4ba4-8c0d-1a3cc3a20111'
    await db('items').insert({
      id: parentId,
      title: 'Parent Item',
      type_id: 'task',
      created_at: new Date('2024-05-31T06:28:47.753Z'),
      updated_at: new Date('2024-05-31T06:28:47.753Z')
    })

    await request(app)
      .post('/items')
      .send({
        title: 'Child Item',
        type: 'task',
        parentId
      })
      .expect(201)
      .then(response => {
        expect(response.body.parentId).toBe(parentId)
      })

    const child = await db('items').where({ title: 'Child Item' }).first()
    expect(child?.parent_id).toBe(parentId)
  })

  it('should return 404 when parentId does not exist', async () => {
    await request(app)
      .post('/items')
      .send({
        title: 'Child Item',
        type: 'task',
        parentId: '00000000-0000-0000-0000-000000000000'
      })
      .expect(404)
  })

  it('should delete existing items with the same name when "replace" parameter is "true"', async () => {
    const testItem1 = {
      id: 'bdb76fb4-98aa-4b48-bb9c-fc647199e09f',
      title: 'Test Item',
      uri: 'http://example.com',
      type_id: 'task',
      length: 10,
      due: new Date('2024-06-01T00:00:00.000Z'),
      created_at: new Date('2024-05-31T00:00:00.000Z'),
      updated_at: new Date('2024-05-31T00:00:00.000Z'),
      deleted_at: null
    }
    const testItem2 = {
      id: '2400b74e-3d59-4fcc-9d5f-3a0ad46a2066',
      title: 'Test Item',
      uri: 'http://example.com/foo',
      type_id: 'task',
      length: 30,
      due: new Date('2024-06-01T00:00:00.000Z'),
      created_at: new Date('2024-05-31T00:00:00.000Z'),
      updated_at: new Date('2024-05-31T00:00:00.000Z'),
      deleted_at: null
    }
    const testItem3 = {
      id: '440c6edb-0489-4a51-bd51-5c301be888f7',
      title: 'Other Item',
      uri: 'http://example.com/bar',
      type_id: 'task',
      length: 10,
      due: new Date('2024-06-01T00:00:00.000Z'),
      created_at: new Date('2024-05-31T00:00:00.000Z'),
      updated_at: new Date('2024-05-31T00:00:00.000Z'),
      deleted_at: null
    }
    await db('items').insert(testItem1)
    await db('items').insert(testItem2)
    await db('items').insert(testItem3)
    await db('item_labels').insert({ item_id: testItem1.id, label_id: 'busywork' })
    await db('item_labels').insert({ item_id: testItem2.id, label_id: 'urgent' })
    await db('item_labels').insert({ item_id: testItem3.id, label_id: 'trivial' })

    await request(app)
      .post('/items')
      .query({ replace: 'true' })
      .send({
        author: 'John Doe',
        due: '2024-06-01T10:00:00.000Z',
        expectedRank: 1,
        imageUri: 'http://example.com/image.jpg',
        labels: ['work', 'urgent'],
        language: 'en',
        length: 100,
        rank: 5,
        rating: 4.5,
        summary: 'This is a summary.',
        title: 'Test Item',
        uri: 'http://example.com',
        type: 'task'
      })
      .expect(201)

    const testItems = await db('items').where({ title: 'Test Item' })
    expect(testItems).toHaveLength(1)

    const nonTestItems = await db('items').whereNot({ title: 'Test Item' })
    expect(nonTestItems).toHaveLength(1)
  })

  it('should NOT delete existing items with the same name when "replace" parameter is NOT "true"', async () => {
    const testItem1 = {
      id: 'bdb76fb4-98aa-4b48-bb9c-fc647199e09f',
      title: 'Test Item',
      uri: 'http://example.com',
      type_id: 'task',
      length: 10,
      due: new Date('2024-06-01T00:00:00.000Z'),
      created_at: new Date('2024-05-31T00:00:00.000Z'),
      updated_at: new Date('2024-05-31T00:00:00.000Z'),
      deleted_at: null
    }
    const testItem2 = {
      id: '2400b74e-3d59-4fcc-9d5f-3a0ad46a2066',
      title: 'Test Item',
      uri: 'http://example.com/foo',
      type_id: 'task',
      length: 30,
      due: new Date('2024-06-01T00:00:00.000Z'),
      created_at: new Date('2024-05-31T00:00:00.000Z'),
      updated_at: new Date('2024-05-31T00:00:00.000Z'),
      deleted_at: null
    }
    const testItem3 = {
      id: '440c6edb-0489-4a51-bd51-5c301be888f7',
      title: 'Other Item',
      uri: 'http://example.com/bar',
      type_id: 'task',
      length: 10,
      due: new Date('2024-06-01T00:00:00.000Z'),
      created_at: new Date('2024-05-31T00:00:00.000Z'),
      updated_at: new Date('2024-05-31T00:00:00.000Z'),
      deleted_at: null
    }
    await db('items').insert(testItem1)
    await db('items').insert(testItem2)
    await db('items').insert(testItem3)
    await db('item_labels').insert({ item_id: testItem1.id, label_id: 'busywork' })
    await db('item_labels').insert({ item_id: testItem2.id, label_id: 'urgent' })
    await db('item_labels').insert({ item_id: testItem3.id, label_id: 'trivial' })

    await request(app)
      .post('/items')
      .query({ replace: 'false' })
      .send({
        author: 'John Doe',
        due: '2024-06-01T10:00:00.000Z',
        expectedRank: 1,
        imageUri: 'http://example.com/image.jpg',
        labels: ['work', 'urgent'],
        language: 'en',
        length: 100,
        rank: 5,
        rating: 4.5,
        summary: 'This is a summary.',
        title: 'Test Item',
        uri: 'http://example.com',
        type: 'task'
      })
      .expect(201)

    const testItems = await db('items').where({ title: 'Test Item' })
    expect(testItems).toHaveLength(3)

    const nonTestItems = await db('items').whereNot({ title: 'Test Item' })
    expect(nonTestItems).toHaveLength(1)
  })

  it('should return 400 when an invalid value is provided', async () => {
    await request(app)
      .post('/items')
      .send({
        title: 'Invalid Item',
        length: 'invalid-length',
        task: 'task'
      })
      .expect(400)
  })
})
