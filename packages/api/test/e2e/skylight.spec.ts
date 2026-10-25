import { createServer, type IncomingHttpHeaders, type Server } from 'node:http'
import { type AddressInfo } from 'node:net'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { clearConfig, getConfig } from '../../src/config.js'
import { getDatabaseConnection } from '../../src/database.js'
import { clearIntegrations } from '../../src/integrations/index.js'
import { getItemLinks } from '../../src/integrations/links.js'
import { toChoreSchedule } from '../../src/integrations/skylight.js'
import { authedRequest } from './helpers/auth.js'

interface SkylightRequest {
  method: string
  url: string
  headers: IncomingHttpHeaders
  body: unknown
}

describe('Skylight integration', () => {
  const db = getDatabaseConnection()
  const task = {
    id: 'bdb76fb4-98aa-4b48-bb9c-fc647199e09f',
    title: 'Take out the trash',
    summary: 'Both bins',
    type_id: 'task',
    due: new Date('2030-01-15T15:30:00.000Z'),
    created_at: new Date('2024-05-31T06:28:47.753Z'),
    updated_at: new Date('2024-05-31T06:28:47.753Z')
  }
  const nonTask = {
    id: '2400b74e-3d59-4fcc-9d5f-3a0ad46a2066',
    title: 'Some book',
    type_id: 'read',
    created_at: new Date('2024-05-31T06:28:34.356Z'),
    updated_at: new Date('2024-05-31T06:28:34.356Z')
  }

  // A fake Skylight API, which records the requests it gets.
  let server: Server
  let serverUrl = ''
  let requests: SkylightRequest[] = []
  let responseStatus = 200
  let responseBody: unknown = {}

  let app: Parameters<typeof authedRequest>[0]
  let originalEnv: NodeJS.ProcessEnv

  const setEnv = (env: Record<string, string | undefined>): void => {
    for (const [key, value] of Object.entries(env)) {
      if (value === undefined) {
        Reflect.deleteProperty(process.env, key)
      } else {
        process.env[key] = value
      }
    }
    clearConfig()
  }

  beforeAll(async () => {
    server = createServer((req, res) => {
      let body = ''
      req.on('data', (chunk: Buffer) => { body += chunk.toString() })
      req.on('end', () => {
        requests.push({ method: req.method ?? '', url: req.url ?? '', headers: req.headers, body: JSON.parse(body) })
        res.writeHead(responseStatus, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(responseBody))
      })
    })
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
    const { port } = server.address() as AddressInfo
    serverUrl = `http://127.0.0.1:${port}/api`

    getConfig() // load the .env files into process.env first
    originalEnv = { ...process.env }
    setEnv({
      INTEGRATIONS: 'skylight',
      SKYLIGHT_API_URL: serverUrl,
      SKYLIGHT_AUTH_HEADER: 'Basic c2VjcmV0',
      SKYLIGHT_FRAME_ID: '4567',
      SKYLIGHT_TIMEZONE: 'America/Chicago'
    })
    clearIntegrations()
    // Load the app after the config is set, so the integration's routes are added.
    ;({ app } = await import('../../src/app.js'))
  })

  afterAll(async () => {
    process.env = originalEnv
    clearConfig()
    clearIntegrations()
    await new Promise(resolve => server.close(resolve))
  })

  beforeEach(async () => {
    requests = []
    responseStatus = 200
    responseBody = { data: { type: 'chore', id: '98765', attributes: {} } }
    setEnv({ SKYLIGHT_API_URL: serverUrl, SKYLIGHT_CATEGORY_ID: '13600771', SKYLIGHT_COMPLETED_BY_CATEGORY_ID: undefined })
    await db('item_integration_links').delete()
    await db('item_labels').delete()
    await db('items').delete()
    await db('items').insert([task, nonTask])
  })

  describe('GET /integrations', () => {
    it('should list the Skylight integration', async () => {
      const response = await authedRequest(app).get('/integrations')
        .expect(200)
      expect(response.body).toEqual([{ id: 'skylight', name: 'Skylight Calendar' }])
    })
  })

  describe('POST /integrations/skylight/chores', () => {
    it('should create an assigned chore for a task', async () => {
      const response = await authedRequest(app).post('/integrations/skylight/chores')
        .send({ itemId: task.id })
        .expect(201)
      expect(response.body).toEqual({ choreId: '98765' })

      expect(requests).toHaveLength(1)
      expect(requests[0]).toMatchObject({
        method: 'POST',
        url: '/api/frames/4567/chores',
        headers: {
          authorization: 'Basic c2VjcmV0',
          'content-type': 'application/json',
          'skylight-api-version': getConfig().SKYLIGHT_API_VERSION
        }
      })
      expect(requests[0].body).toEqual({
        summary: task.title,
        description: task.summary,
        start: '2030-01-15',
        start_time: '09:30',
        status: 'pending',
        category_id: '13600771'
      })
    })

    it('should create an "up for grabs" chore when no category is configured', async () => {
      setEnv({ SKYLIGHT_CATEGORY_ID: undefined })
      responseBody = { data: [{ type: 'chore', id: 55555, attributes: {} }] }
      const response = await authedRequest(app).post('/integrations/skylight/chores')
        .send({ itemId: task.id })
        .expect(201)
      expect(response.body).toEqual({ choreId: '55555' })

      expect(requests[0].url).toBe('/api/frames/4567/chores/create_multiple')
      expect(requests[0].body).toEqual({
        summary: task.title,
        description: task.summary,
        start: '2030-01-15',
        start_time: '09:30',
        up_for_grabs: true
      })
    })

    it('should leave out the description when the task has no summary', async () => {
      await db('items').update({ summary: null }).where({ id: task.id })
      await authedRequest(app).post('/integrations/skylight/chores')
        .send({ itemId: task.id })
        .expect(201)
      expect(requests[0].body).not.toHaveProperty('description')
    })

    it('should not send items that are not tasks', async () => {
      const response = await authedRequest(app).post('/integrations/skylight/chores')
        .send({ itemId: nonTask.id })
        .expect(400)
      expect(response.body).toEqual({ error: 'Only tasks can be sent to Skylight' })
      expect(requests).toHaveLength(0)
    })

    it('should return a 404 for a missing item', async () => {
      await authedRequest(app).post('/integrations/skylight/chores')
        .send({ itemId: 'c0ffee00-0000-4000-8000-000000000000' })
        .expect(404)
      expect(requests).toHaveLength(0)
    })

    it('should require an item ID', async () => {
      await authedRequest(app).post('/integrations/skylight/chores')
        .send({})
        .expect(400)
      expect(requests).toHaveLength(0)
    })

    it('should return a 502 without the response details when Skylight rejects the request', async () => {
      responseStatus = 401
      responseBody = { errors: [{ detail: 'secret details' }] }
      const response = await authedRequest(app).post('/integrations/skylight/chores')
        .send({ itemId: task.id })
        .expect(502)
      expect(response.body).toEqual({ error: 'The Skylight API responded with status 401' })
    })

    it('should return a 502 when Skylight is unreachable', async () => {
      setEnv({ SKYLIGHT_API_URL: 'http://127.0.0.1:1/api' })
      const response = await authedRequest(app).post('/integrations/skylight/chores')
        .send({ itemId: task.id })
        .expect(502)
      expect(response.body).toEqual({ error: 'Could not reach the Skylight API' })
    })

    it('should return an empty chore ID if Skylight does not return one', async () => {
      responseBody = {}
      const response = await authedRequest(app).post('/integrations/skylight/chores')
        .send({ itemId: task.id })
        .expect(201)
      expect(response.body).toEqual({ choreId: '' })
    })
  })

  describe('completing items', () => {
    const linkChore = async (itemId: string, choreId: string): Promise<void> => {
      await db('item_integration_links').insert({ item_id: itemId, integration_id: 'skylight', external_id: choreId })
    }
    const completeTask = async (): Promise<Record<string, unknown>> => {
      const response = await authedRequest(app).patch(`/items/${task.id}`)
        .send({ deletedAt: '2030-01-15T16:00:00.000Z' })
        .expect(200)
      return response.body
    }

    it('should remember the chores that tasks are sent as', async () => {
      await authedRequest(app).post('/integrations/skylight/chores')
        .send({ itemId: task.id })
        .expect(201)
      expect(await getItemLinks(task.id, 'skylight')).toEqual(['98765'])
    })

    it('should not remember a chore without an ID', async () => {
      responseBody = {}
      await authedRequest(app).post('/integrations/skylight/chores')
        .send({ itemId: task.id })
        .expect(201)
      expect(await getItemLinks(task.id, 'skylight')).toEqual([])
    })

    it('should complete the linked chores when the item is checked off', async () => {
      await linkChore(task.id, '98765')
      await linkChore(task.id, '55780859-2030-01-15-0600')
      const body = await completeTask()
      expect(body).toMatchObject({ id: task.id, deletedAt: '2030-01-15T16:00:00.000Z' })
      expect(body).not.toHaveProperty('warnings')

      expect(requests).toHaveLength(2)
      expect(requests).toEqual(expect.arrayContaining([
        expect.objectContaining({
          method: 'PUT',
          url: '/api/frames/4567/chores/98765/completions',
          headers: expect.objectContaining({ authorization: 'Basic c2VjcmV0' }),
          body: { status: 'complete', category_id: '13600771' }
        }),
        expect.objectContaining({
          method: 'PUT',
          url: '/api/frames/4567/chores/55780859/completions',
          body: { status: 'complete', category_id: '13600771', instance_date: '2030-01-15', instance_time: '06:00' }
        })
      ]))
    })

    it('should credit the completion to the "completed by" profile, if set', async () => {
      setEnv({ SKYLIGHT_CATEGORY_ID: undefined, SKYLIGHT_COMPLETED_BY_CATEGORY_ID: '24680' })
      await linkChore(task.id, '98765')
      await completeTask()
      expect(requests.map(request => request.body)).toEqual([{ status: 'complete', category_id: '24680' }])
    })

    it('should fall back to the chore profile if the "completed by" profile is blank', async () => {
      setEnv({ SKYLIGHT_COMPLETED_BY_CATEGORY_ID: ' ' })
      await linkChore(task.id, '98765')
      await completeTask()
      expect(requests.map(request => request.body)).toEqual([{ status: 'complete', category_id: '13600771' }])
    })

    it('should warn, without contacting Skylight, if no profile is configured', async () => {
      setEnv({ SKYLIGHT_CATEGORY_ID: undefined })
      await linkChore(task.id, '98765')
      const body = await completeTask()
      expect(body).toMatchObject({
        deletedAt: '2030-01-15T16:00:00.000Z',
        warnings: ['Could not mark the item as completed in Skylight Calendar: Set SKYLIGHT_COMPLETED_BY_CATEGORY_ID (or SKYLIGHT_CATEGORY_ID) on the server to mark chores complete']
      })
      expect(requests).toHaveLength(0)
    })

    it('should not need a profile for items without linked chores', async () => {
      setEnv({ SKYLIGHT_CATEGORY_ID: undefined })
      const body = await completeTask()
      expect(body).not.toHaveProperty('warnings')
    })

    it('should still check off the item, with a warning, if Skylight fails', async () => {
      await linkChore(task.id, '98765')
      responseStatus = 401
      const body = await completeTask()
      expect(body).toMatchObject({
        deletedAt: '2030-01-15T16:00:00.000Z',
        warnings: ['Could not mark the item as completed in Skylight Calendar: The Skylight API responded with status 401']
      })
      const [row] = await db('items').select('deleted_at').where({ id: task.id })
      expect(row.deleted_at).not.toBeNull()
    })

    it('should not contact Skylight for items without linked chores', async () => {
      const body = await completeTask()
      expect(body).not.toHaveProperty('warnings')
      expect(requests).toHaveLength(0)
    })

    it('should not contact Skylight for other updates', async () => {
      await linkChore(task.id, '98765')
      await authedRequest(app).patch(`/items/${task.id}`)
        .send({ title: 'Renamed' })
        .expect(200)
      await db('items').update({ deleted_at: new Date() }).where({ id: task.id })
      // Already checked off
      await authedRequest(app).patch(`/items/${task.id}`)
        .send({ deletedAt: '2030-01-16T16:00:00.000Z' })
        .expect(200)
      // Restored
      await authedRequest(app).patch(`/items/${task.id}`)
        .send({ deletedAt: null })
        .expect(200)
      expect(requests).toHaveLength(0)
    })

    it('should delete the links when the item is deleted', async () => {
      await linkChore(task.id, '98765')
      await authedRequest(app).delete(`/items/${task.id}`)
        .expect(204)
      expect(await getItemLinks(task.id, 'skylight')).toEqual([])
    })
  })

  describe('toChoreSchedule()', () => {
    it('should convert the due date to the local date and time', () => {
      expect(toChoreSchedule('2030-01-15T03:30:00.000Z', 'America/Chicago')).toEqual({ start: '2030-01-14', start_time: '21:30' })
      expect(toChoreSchedule('2030-07-01T23:05:00.000Z', 'Asia/Tokyo')).toEqual({ start: '2030-07-02', start_time: '08:05' })
    })

    it('should leave out the time for a due time of midnight', () => {
      expect(toChoreSchedule('2030-01-15T06:00:00.000Z', 'America/Chicago')).toEqual({ start: '2030-01-15' })
    })

    it('should use today when there is no due date', () => {
      const now = new Date('2030-03-10T04:00:00.000Z')
      expect(toChoreSchedule(null, 'UTC', now)).toEqual({ start: '2030-03-10' })
      expect(toChoreSchedule(null, 'America/Chicago', now)).toEqual({ start: '2030-03-09' })
    })
  })
})
