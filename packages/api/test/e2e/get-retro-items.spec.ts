import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { app } from '../../src/app.js'
import { getDatabaseConnection } from '../../src/database.js'

describe('GET /items/retro', () => {
  const db = getDatabaseConnection()

  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
  const threeWeeksAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000)

  const readItem = {
    id: 'b1000000-0000-4000-8000-000000000001',
    title: 'Read Item',
    type_id: 'read',
    created_at: twoDaysAgo,
    updated_at: yesterday,
    deleted_at: yesterday
  }
  const taskItem = {
    id: 'b1000000-0000-4000-8000-000000000002',
    title: 'Task Item',
    type_id: 'task',
    created_at: twoDaysAgo,
    updated_at: twoDaysAgo,
    deleted_at: twoDaysAgo
  }
  const oldItem = {
    id: 'b1000000-0000-4000-8000-000000000003',
    title: 'Old Item (outside window)',
    type_id: 'task',
    created_at: threeWeeksAgo,
    updated_at: threeWeeksAgo,
    deleted_at: threeWeeksAgo
  }
  const activeItem = {
    id: 'b1000000-0000-4000-8000-000000000004',
    title: 'Active Item (not deleted)',
    type_id: 'task',
    created_at: twoDaysAgo,
    updated_at: twoDaysAgo,
    deleted_at: null
  }

  beforeEach(async () => {
    await db('item_labels').delete()
    await db('items').delete()
    await db('items').insert(readItem)
    await db('items').insert(taskItem)
    await db('items').insert(oldItem)
    await db('items').insert(activeItem)
    await db('item_labels').insert({ item_id: taskItem.id, label_id: 'work' })
    await db('item_labels').insert({ item_id: taskItem.id, label_id: 'urgent' })
  })

  it('should return items soft-deleted within the past week by default', async () => {
    await request(app)
      .get('/items/retro')
      .expect(200)
      .then(response => {
        const ids = response.body.map((item: { id: string }) => item.id)
        expect(ids).toContain(readItem.id)
        expect(ids).toContain(taskItem.id)
        expect(ids).not.toContain(oldItem.id)
        expect(ids).not.toContain(activeItem.id)
      })
  })

  it('should sort items by type then deleted_at ascending', async () => {
    await request(app)
      .get('/items/retro')
      .expect(200)
      .then(response => {
        // read sorts alphabetically before task
        expect(response.body[0].id).toBe(readItem.id)
        expect(response.body[1].id).toBe(taskItem.id)
      })
  })

  it('should include labels with items', async () => {
    await request(app)
      .get('/items/retro')
      .expect(200)
      .then(response => {
        const task = response.body.find((item: { id: string }) => item.id === taskItem.id)
        expect(task.labels).toEqual(expect.arrayContaining(['work', 'urgent']))
        expect(task.labels).toHaveLength(2)
      })
  })

  it('should respect the since parameter', async () => {
    const sinceTime = new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString()
    await request(app)
      .get(`/items/retro?since=${encodeURIComponent(sinceTime)}`)
      .expect(200)
      .then(response => {
        const ids = response.body.map((item: { id: string }) => item.id)
        expect(ids).toContain(readItem.id)
        expect(ids).not.toContain(taskItem.id)
      })
  })

  it('should filter by type (string)', async () => {
    await request(app)
      .get('/items/retro?type=task')
      .expect(200)
      .then(response => {
        const ids = response.body.map((item: { id: string }) => item.id)
        expect(ids).toContain(taskItem.id)
        expect(ids).not.toContain(readItem.id)
      })
  })

  it('should filter by type (array)', async () => {
    await request(app)
      .get('/items/retro?type=task&type=read')
      .expect(200)
      .then(response => {
        const ids = response.body.map((item: { id: string }) => item.id)
        expect(ids).toContain(taskItem.id)
        expect(ids).toContain(readItem.id)
      })
  })

  it('should filter by label', async () => {
    await request(app)
      .get('/items/retro?label=urgent')
      .expect(200)
      .then(response => {
        const ids = response.body.map((item: { id: string }) => item.id)
        expect(ids).toContain(taskItem.id)
        expect(ids).not.toContain(readItem.id)
      })
  })

  it('should return an empty array when no items fall in the range', async () => {
    const futureTime = new Date(now.getTime() + 60 * 1000).toISOString()
    await request(app)
      .get(`/items/retro?since=${encodeURIComponent(futureTime)}`)
      .expect(200)
      .then(response => {
        expect(response.body).toEqual([])
      })
  })

  it('should return 400 when given an unknown query param', async () => {
    await request(app)
      .get('/items/retro?unknownParam=1')
      .expect(400)
      .then(response => {
        expect(response.body.error).toEqual(expect.any(String))
      })
  })

  it('should return 400 when since is not a valid datetime', async () => {
    await request(app)
      .get('/items/retro?since=notadate')
      .expect(400)
      .then(response => {
        expect(response.body.error).toEqual(expect.any(String))
      })
  })
})
