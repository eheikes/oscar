import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { app } from '../../src/app.js'
import { getDatabaseConnection } from '../../src/database.js'

describe('GET /items/:typeId', () => {
  const db = getDatabaseConnection()

  beforeEach(async () => {
    await db('item_labels').delete()
    await db('items').delete()
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

  describe('for task items', () => {
    const dueInPast = '2024-06-01T00:00:00.000Z'
    const dueToday = new Date(Date.now() + 1000 * 60 * 10).toISOString()
    const dueDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()

    it('should sort by urgent, then busywork, then non-trivial, then trivial', async () => {
      const testItem1 = {
        id: 'bdb76fb4-98aa-4b48-bb9c-fc647199e09f',
        title: 'Item 1',
        uri: 'http://example.com',
        type_id: 'task',
        due: new Date('2024-06-10T00:00:00.000Z'),
        created_at: new Date('2024-05-31T00:00:00.000Z'),
        updated_at: new Date('2024-05-31T00:00:00.000Z')
      }
      const testItem2 = {
        id: '2400b74e-3d59-4fcc-9d5f-3a0ad46a2066',
        title: 'Item 2',
        uri: 'http://example.com/foo',
        type_id: 'task',
        due: new Date('2024-06-10T00:00:00.000Z'),
        created_at: new Date('2024-05-31T00:00:00.000Z'),
        updated_at: new Date('2024-05-31T00:00:00.000Z')
      }
      const testItem3 = {
        id: '440c6edb-0489-4a51-bd51-5c301be888f7',
        title: 'Item 3',
        uri: 'http://example.com/bar',
        type_id: 'task',
        due: new Date('2024-06-10T00:00:00.000Z'),
        created_at: new Date('2024-05-31T00:00:00.000Z'),
        updated_at: new Date('2024-05-31T00:00:00.000Z')
      }
      const testItem4 = {
        id: '621c06ed-f0d4-4d4b-82d7-7a5a464e11a8',
        title: 'Item 4',
        uri: 'http://example.com/baz',
        type_id: 'task',
        due: new Date('2024-06-10T00:00:00.000Z'),
        created_at: new Date('2024-05-31T00:00:00.000Z'),
        updated_at: new Date('2024-05-31T00:00:00.000Z')
      }

      await db('items').insert(testItem1)
      await db('items').insert(testItem2)
      await db('items').insert(testItem3)
      await db('items').insert(testItem4)
      await db('item_labels').insert({ item_id: testItem1.id, label_id: 'busywork' })
      await db('item_labels').insert({ item_id: testItem2.id, label_id: 'urgent' })
      await db('item_labels').insert({ item_id: testItem3.id, label_id: 'trivial' })

      await request(app)
        .get('/items/next?type=task&count=4')
        .expect(200)
        .then(response => {
          expect(response.body[0].item.id).toEqual(testItem2.id)
          expect(response.body[0].item.labels).toEqual(['urgent'])
          expect(response.body[0].reason).toEqual('This item is labeled urgent.')
          expect(response.body[1].item.id).toEqual(testItem1.id)
          expect(response.body[1].item.labels).toEqual(['busywork'])
          expect(response.body[1].reason).toEqual('This item is labeled busywork.')
          expect(response.body[2].item.id).toEqual(testItem4.id)
          expect(response.body[2].item.labels).toEqual([])
          expect(response.body[2].reason).toEqual('This item is next in order.')
          expect(response.body[3].item.id).toEqual(testItem3.id)
          expect(response.body[3].item.labels).toEqual(['trivial'])
          expect(response.body[3].reason).toEqual('This item is labeled trivial.')
        })
    })

    it('should choose an overdue busywork item if an important item was just worked on', async () => {
      const testItem1 = { // completed item
        id: 'bdb76fb4-98aa-4b48-bb9c-fc647199e09f',
        title: 'Item 1',
        uri: 'http://example.com',
        type_id: 'task',
        length: 60,
        due: new Date(dueInPast),
        created_at: new Date('2024-05-31T00:00:00.000Z'),
        updated_at: new Date('2024-05-31T00:00:00.000Z'),
        deleted_at: new Date('2024-05-31T00:00:00.000Z')
      }
      const testItem2 = { // due today
        id: '2400b74e-3d59-4fcc-9d5f-3a0ad46a2066',
        title: 'Item 2',
        uri: 'http://example.com/foo',
        type_id: 'task',
        length: 10,
        due: new Date(dueToday),
        created_at: new Date('2024-05-31T00:00:00.000Z'),
        updated_at: new Date('2024-05-31T00:00:00.000Z')
      }
      const testItem3 = { // overdue
        id: '440c6edb-0489-4a51-bd51-5c301be888f7',
        title: 'Item 3',
        uri: 'http://example.com/bar',
        type_id: 'task',
        length: 10,
        due: new Date(dueDaysAgo),
        created_at: new Date('2024-05-31T00:00:00.000Z'),
        updated_at: new Date('2024-05-31T00:00:00.000Z')
      }
      const testItem4 = { // important
        id: '621c06ed-f0d4-4d4b-82d7-7a5a464e11a8',
        title: 'Item 4',
        uri: 'http://example.com/baz',
        type_id: 'task',
        length: 10,
        due: new Date(dueToday),
        created_at: new Date('2024-05-31T00:00:00.000Z'),
        updated_at: new Date('2024-05-31T00:00:00.000Z')
      }

      await db('items').insert(testItem1)
      await db('items').insert(testItem2)
      await db('items').insert(testItem3)
      await db('items').insert(testItem4)
      await db('item_labels').insert({ item_id: testItem1.id, label_id: 'important' })
      await db('item_labels').insert({ item_id: testItem2.id, label_id: 'busywork' })
      await db('item_labels').insert({ item_id: testItem3.id, label_id: 'busywork' })
      await db('item_labels').insert({ item_id: testItem4.id, label_id: 'important' })
      await db('item_labels').insert({ item_id: testItem1.id, label_id: 'personal' })
      await db('item_labels').insert({ item_id: testItem2.id, label_id: 'personal' })
      await db('item_labels').insert({ item_id: testItem3.id, label_id: 'personal' })
      await db('item_labels').insert({ item_id: testItem4.id, label_id: 'personal' })

      await request(app)
        .get('/items/next?type=task&label=personal&count=1')
        .expect(200)
        .then(response => {
          expect(response.body[0].item.id).toEqual(testItem3.id)
        })
    })

    it('should choose another busywork item due today if the chunk size is not met', async () => {
      const testItem1 = { // completed item
        id: 'bdb76fb4-98aa-4b48-bb9c-fc647199e09f',
        title: 'Item 1',
        uri: 'http://example.com',
        type_id: 'task',
        length: 5,
        due: new Date(dueToday),
        created_at: new Date('2024-05-31T00:00:00.000Z'),
        updated_at: new Date('2024-05-31T00:00:00.000Z'),
        deleted_at: new Date()
      }
      const testItem2 = { // due today
        id: '2400b74e-3d59-4fcc-9d5f-3a0ad46a2066',
        title: 'Item 2',
        uri: 'http://example.com/foo',
        type_id: 'task',
        length: 10,
        due: new Date(dueToday),
        created_at: new Date('2024-05-31T00:00:00.000Z'),
        updated_at: new Date('2024-05-31T00:00:00.000Z')
      }
      const testItem3 = { // overdue
        id: '440c6edb-0489-4a51-bd51-5c301be888f7',
        title: 'Item 3',
        uri: 'http://example.com/bar',
        type_id: 'task',
        length: 10,
        due: new Date(dueDaysAgo),
        created_at: new Date('2024-05-31T00:00:00.000Z'),
        updated_at: new Date('2024-05-31T00:00:00.000Z')
      }
      const testItem4 = { // important
        id: '621c06ed-f0d4-4d4b-82d7-7a5a464e11a8',
        title: 'Item 4',
        uri: 'http://example.com/baz',
        type_id: 'task',
        length: 10,
        due: new Date(dueToday),
        created_at: new Date('2024-05-31T00:00:00.000Z'),
        updated_at: new Date('2024-05-31T00:00:00.000Z')
      }

      await db('items').insert(testItem1)
      await db('items').insert(testItem2)
      await db('items').insert(testItem3)
      await db('items').insert(testItem4)
      await db('item_labels').insert({ item_id: testItem1.id, label_id: 'busywork' })
      await db('item_labels').insert({ item_id: testItem2.id, label_id: 'busywork' })
      await db('item_labels').insert({ item_id: testItem3.id, label_id: 'busywork' })
      await db('item_labels').insert({ item_id: testItem4.id, label_id: 'important' })
      await db('item_labels').insert({ item_id: testItem1.id, label_id: 'personal' })
      await db('item_labels').insert({ item_id: testItem2.id, label_id: 'personal' })
      await db('item_labels').insert({ item_id: testItem3.id, label_id: 'personal' })
      await db('item_labels').insert({ item_id: testItem4.id, label_id: 'personal' })

      await request(app)
        .get('/items/next?type=task&label=personal&count=1')
        .expect(200)
        .then(response => {
          expect(response.body[0].item.id).toEqual(testItem2.id)
          expect(response.body[0].reason).toContain('Currently working through a chunk of busywork due today.')
        })
    })

    it('should choose an important item if busywork items due today were just worked on', async () => {
      const testItem1 = { // completed item
        id: 'bdb76fb4-98aa-4b48-bb9c-fc647199e09f',
        title: 'Item 1',
        uri: 'http://example.com',
        type_id: 'task',
        length: 10,
        due: new Date(dueToday),
        created_at: new Date('2024-05-31T00:00:00.000Z'),
        updated_at: new Date('2024-05-31T00:00:00.000Z'),
        deleted_at: new Date('2024-05-31T00:00:00.000Z')
      }
      const testItem2 = { // another completed today
        id: '2400b74e-3d59-4fcc-9d5f-3a0ad46a2066',
        title: 'Item 2',
        uri: 'http://example.com/foo',
        type_id: 'task',
        length: 30,
        due: new Date(dueToday),
        created_at: new Date('2024-05-31T00:00:00.000Z'),
        updated_at: new Date('2024-05-31T00:00:00.000Z'),
        deleted_at: new Date('2024-05-31T00:00:00.000Z')
      }
      const testItem3 = { // overdue
        id: '440c6edb-0489-4a51-bd51-5c301be888f7',
        title: 'Item 3',
        uri: 'http://example.com/bar',
        type_id: 'task',
        length: 10,
        due: new Date(dueDaysAgo),
        created_at: new Date('2024-05-31T00:00:00.000Z'),
        updated_at: new Date('2024-05-31T00:00:00.000Z')
      }
      const testItem4 = { // due today
        id: '621c06ed-f0d4-4d4b-82d7-7a5a464e11a8',
        title: 'Item 4',
        uri: 'http://example.com/baz',
        type_id: 'task',
        length: 10,
        due: new Date(dueToday),
        created_at: new Date('2024-05-31T00:00:00.000Z'),
        updated_at: new Date('2024-05-31T00:00:00.000Z')
      }
      const testItem5 = { // important
        id: 'dd46384c-49d5-4bd2-8bb0-2186e66b8287',
        title: 'Item 5',
        uri: 'http://example.com/qux',
        type_id: 'task',
        length: 10,
        due: new Date(dueInPast),
        created_at: new Date('2024-05-31T00:00:00.000Z'),
        updated_at: new Date('2024-05-31T00:00:00.000Z')
      }

      await db('items').insert(testItem1)
      await db('items').insert(testItem2)
      await db('items').insert(testItem3)
      await db('items').insert(testItem4)
      await db('items').insert(testItem5)
      await db('item_labels').insert({ item_id: testItem1.id, label_id: 'busywork' })
      await db('item_labels').insert({ item_id: testItem2.id, label_id: 'busywork' })
      await db('item_labels').insert({ item_id: testItem3.id, label_id: 'busywork' })
      await db('item_labels').insert({ item_id: testItem4.id, label_id: 'busywork' })
      await db('item_labels').insert({ item_id: testItem5.id, label_id: 'important' })

      await request(app)
        .get('/items/next?type=task&count=1')
        .expect(200)
        .then(response => {
          expect(response.body[0].item.id).toEqual(testItem5.id)
        })
    })

    it('should choose a busywork item due today if overdue busywork items were just worked on', async () => {
      const testItem1 = { // completed item
        id: 'bdb76fb4-98aa-4b48-bb9c-fc647199e09f',
        title: 'Item 1',
        uri: 'http://example.com',
        type_id: 'task',
        length: 10,
        due: new Date(dueInPast),
        created_at: new Date('2024-05-31T00:00:00.000Z'),
        updated_at: new Date('2024-05-31T00:00:00.000Z'),
        deleted_at: new Date('2024-05-31T00:00:00.000Z')
      }
      const testItem2 = { // another completed today
        id: '2400b74e-3d59-4fcc-9d5f-3a0ad46a2066',
        title: 'Item 2',
        uri: 'http://example.com/foo',
        type_id: 'task',
        length: 30,
        due: new Date(dueInPast),
        created_at: new Date('2024-05-31T00:00:00.000Z'),
        updated_at: new Date('2024-05-31T00:00:00.000Z'),
        deleted_at: new Date('2024-05-31T00:00:00.000Z')
      }
      const testItem3 = { // overdue
        id: '440c6edb-0489-4a51-bd51-5c301be888f7',
        title: 'Item 3',
        uri: 'http://example.com/bar',
        type_id: 'task',
        length: 10,
        due: new Date(dueDaysAgo),
        created_at: new Date('2024-05-31T00:00:00.000Z'),
        updated_at: new Date('2024-05-31T00:00:00.000Z')
      }
      const testItem4 = { // due today
        id: '621c06ed-f0d4-4d4b-82d7-7a5a464e11a8',
        title: 'Item 4',
        uri: 'http://example.com/baz',
        type_id: 'task',
        length: 10,
        due: new Date(dueToday),
        created_at: new Date('2024-05-31T00:00:00.000Z'),
        updated_at: new Date('2024-05-31T00:00:00.000Z')
      }
      const testItem5 = { // important
        id: 'dd46384c-49d5-4bd2-8bb0-2186e66b8287',
        title: 'Item 5',
        uri: 'http://example.com/qux',
        type_id: 'task',
        length: 10,
        due: new Date(dueInPast),
        created_at: new Date('2024-05-31T00:00:00.000Z'),
        updated_at: new Date('2024-05-31T00:00:00.000Z')
      }

      await db('items').insert(testItem1)
      await db('items').insert(testItem2)
      await db('items').insert(testItem3)
      await db('items').insert(testItem4)
      await db('items').insert(testItem5)
      await db('item_labels').insert({ item_id: testItem1.id, label_id: 'busywork' })
      await db('item_labels').insert({ item_id: testItem2.id, label_id: 'busywork' })
      await db('item_labels').insert({ item_id: testItem3.id, label_id: 'busywork' })
      await db('item_labels').insert({ item_id: testItem4.id, label_id: 'busywork' })
      await db('item_labels').insert({ item_id: testItem5.id, label_id: 'important' })

      await request(app)
        .get('/items/next?type=task&count=1')
        .expect(200)
        .then(response => {
          expect(response.body[0].item.id).toEqual(testItem4.id)
        })
    })
  })

  describe('for non-task items', () => {
    const testItem1 = {
      id: 'bdb76fb4-98aa-4b48-bb9c-fc647199e09f',
      title: 'Item 1',
      uri: 'http://example.com',
      type_id: 'play',
      created_at: new Date('2024-05-31T06:28:47.753Z'),
      updated_at: new Date('2024-05-31T06:28:47.753Z')
    }
    const testItem2 = {
      id: '2400b74e-3d59-4fcc-9d5f-3a0ad46a2066',
      title: 'Item 2',
      uri: 'http://example.com/foo',
      type_id: 'play',
      rank: 8,
      created_at: new Date('2024-05-20T06:28:34.356Z'),
      updated_at: new Date('2024-05-20T06:28:34.356Z')
    }
    const testItem3 = {
      id: '440c6edb-0489-4a51-bd51-5c301be888f7',
      title: 'Item 3',
      uri: 'http://example.com/bar',
      type_id: 'play',
      created_at: new Date('2024-05-18T06:28:34.356Z'),
      updated_at: new Date('2024-05-18T06:28:34.356Z')
    }

    beforeEach(async () => {
      await db('items').insert(testItem1)
      await db('item_labels').insert({ item_id: testItem1.id, label_id: 'work' })
      await db('items').insert(testItem2)
      await db('items').insert(testItem3)
    })

    it('should sort by rank, then creation date', async () => {
      await request(app)
        .get('/items/next?type=play&count=3')
        .expect(200)
        .then(response => {
          expect(response.body[0].item.id).toEqual(testItem2.id)
          expect(response.body[0].item.labels).toEqual([])
          expect(response.body[0].reason).toEqual('This item has a rank of 8.0.')
          expect(response.body[1].item.id).toEqual(testItem3.id)
          expect(response.body[1].item.labels).toEqual([])
          expect(response.body[1].reason).toEqual('This is the next-oldest item.')
          expect(response.body[2].item.id).toEqual(testItem1.id)
          expect(response.body[2].item.labels).toEqual(['work'])
          expect(response.body[2].reason).toEqual('This is the next-oldest item.')
        })
    })

    it('should filter labels', async () => {
      await request(app)
        .get('/items/next?type=play&count=3&label=work')
        .expect(200)
        .then(response => {
          expect(response.body.length).toEqual(1)
          expect(response.body[0].item.id).toEqual(testItem1.id)
          expect(response.body[0].item.labels).toEqual(['work'])
        })
    })

    it('should ignore parent items while they have active children', async () => {
      const parent = {
        id: '78328e34-9ec0-44de-9d00-d127d0f7f701',
        title: 'Parent Item',
        uri: 'http://example.com/parent',
        type_id: 'play',
        rank: 10,
        created_at: new Date('2024-05-31T06:28:47.753Z'),
        updated_at: new Date('2024-05-31T06:28:47.753Z')
      }
      const child = {
        id: 'd0730f03-1d94-43d6-aa8c-e0e183da8022',
        title: 'Child Item',
        uri: 'http://example.com/child',
        type_id: 'play',
        rank: 1,
        parent_id: parent.id,
        created_at: new Date('2024-05-30T06:28:34.356Z'),
        updated_at: new Date('2024-05-30T06:28:34.356Z')
      }

      await db('items').insert(parent)
      await db('items').insert(child)

      await request(app)
        .get('/items/next?type=play&count=2')
        .expect(200)
        .then(response => {
          expect(response.body.map((entry: { item: { id: string } }) => entry.item.id)).not.toContain(parent.id)
          expect(response.body.map((entry: { item: { id: string } }) => entry.item.id)).toContain(child.id)
        })
    })

    it('should include parent items after all children are soft-deleted', async () => {
      const parent = {
        id: '666b2db5-326a-4b1f-9b0d-2f8146ea3dc8',
        title: 'Parent Item',
        uri: 'http://example.com/parent-2',
        type_id: 'play',
        rank: 9,
        created_at: new Date('2024-05-31T06:28:47.753Z'),
        updated_at: new Date('2024-05-31T06:28:47.753Z')
      }
      const child = {
        id: 'e5db2917-6afe-4c02-9654-18f7f8c658b4',
        title: 'Child Item',
        uri: 'http://example.com/child-2',
        type_id: 'play',
        parent_id: parent.id,
        deleted_at: new Date('2024-06-01T00:00:00.000Z'),
        created_at: new Date('2024-05-30T06:28:34.356Z'),
        updated_at: new Date('2024-05-30T06:28:34.356Z')
      }

      await db('items').insert(parent)
      await db('items').insert(child)

      await request(app)
        .get('/items/next?type=play&count=1')
        .expect(200)
        .then(response => {
          expect(response.body[0].item.id).toBe(parent.id)
        })
    })
  })
})
