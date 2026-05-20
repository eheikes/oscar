import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { app } from '../../src/app.js'
import { getDatabaseConnection } from '../../src/database.js'

describe('POST /items', () => {
  const db = getDatabaseConnection()

  beforeEach(async () => {
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
  })

  it('should return the new item in the response body', async () => {
    await request(app)
      .post('/items')
      .send({
        author: 'John Doe',
        due: '2024-06-01T10:00:00.000Z',
        expectedRank: 1,
        imageUri: 'http://example.com/image.jpg',
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

  it('should use null values for optional fields', async () => {
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
        expect(response.body.language).toBe(null)
        expect(response.body.length).toBe(null)
        expect(response.body.rank).toBe(null)
        expect(response.body.rating).toBe(null)
        expect(response.body.summary).toBe(null)
        expect(response.body.uri).toBe(null)
      })
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
