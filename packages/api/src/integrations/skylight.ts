// Cross-posts tasks to a Skylight Calendar as chores.
// The Skylight API is unofficial and undocumented; the requests here are based on community
// research (e.g. https://github.com/sebrandon1/go-skylight) and may break if Skylight changes it.
import { Router } from 'express'
import { z } from 'zod'
import { type Config, getConfig } from '../config.js'
import type { Controller } from '../controllers.js'
import { ClientError, IntegrationError, UpstreamError } from '../error.js'
import { getItem, type Item } from '../items.js'
import { logger } from '../logger.js'
import type { Integration } from './index.js'
import { addItemLink, getItemLinks } from './links.js'
import { getAuthorizationHeader, keepTokensAlive, usesRefreshToken } from './skylight-auth.js'

const REQUEST_TIMEOUT_MS = 10000
const MAX_LOGGED_BODY_LENGTH = 1000

export interface ChoreSchedule {
  start: string // YYYY-MM-DD
  start_time?: string // HH:MM
}

export interface ChoreResult {
  choreId: string
}

// Converts a due date to the local date & time in the given time zone.
// Items without a due date are scheduled for today, and a due time of midnight is treated as
// "any time that day", since Skylight chores don't need a time.
export const toChoreSchedule = (due: string | null, timeZone: string, now = new Date()): ChoreSchedule => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(due === null ? now : new Date(due))
  const part = (type: Intl.DateTimeFormatPartTypes): string => parts.find(p => p.type === type)?.value ?? ''
  const schedule: ChoreSchedule = { start: `${part('year')}-${part('month')}-${part('day')}` }
  const time = `${part('hour')}:${part('minute')}`
  if (due !== null && time !== '00:00') {
    schedule.start_time = time
  }
  return schedule
}

const getChoreId = (body: unknown): string => {
  // POST /chores returns a single resource, and POST /chores/create_multiple returns an array.
  const data = (body as { data?: unknown } | null)?.data
  const resource = Array.isArray(data) ? data[0] : data
  const id = (resource as { id?: unknown } | undefined)?.id
  return id === undefined || id === null ? '' : String(id)
}

// Sends a request to the Skylight API for the configured frame, and returns the response body.
const skylightRequest = async (method: string, path: string, body: unknown): Promise<unknown> => {
  const config = getConfig()
  const frameId = encodeURIComponent(config.SKYLIGHT_FRAME_ID ?? '')
  const send = async (authorization: string): Promise<Response> => {
    try {
      return await fetch(`${config.SKYLIGHT_API_URL}/frames/${frameId}${path}`, {
        method,
        headers: {
          Accept: 'application/json',
          Authorization: authorization,
          'Content-Type': 'application/json',
          'skylight-api-version': config.SKYLIGHT_API_VERSION
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      })
    } catch (err) {
      logger.error({ err }, 'Skylight request failed')
      throw new UpstreamError('Could not reach the Skylight API')
    }
  }

  const authorization = await getAuthorizationHeader()
  let res = await send(authorization)
  if (res.status === 401 && usesRefreshToken(config)) {
    // The access token may have been revoked before it expired. Get a new one and try once more.
    logger.warn('Skylight rejected the access token; refreshing it')
    res = await send(await getAuthorizationHeader(authorization))
  }

  if (!res.ok) {
    // The response body might help with debugging, but isn't safe to pass on to the client.
    const responseBody = (await res.text()).slice(0, MAX_LOGGED_BODY_LENGTH)
    logger.error({ status: res.status, body: responseBody }, 'Skylight request was rejected')
    throw new UpstreamError(`The Skylight API responded with status ${res.status}`)
  }

  return await res.json().catch(() => null)
}

export const createChore = async (item: Item): Promise<ChoreResult> => {
  const config = getConfig()
  const categoryId = config.SKYLIGHT_CATEGORY_ID ?? ''
  const isAssigned = categoryId !== ''
  const chore = {
    summary: item.title,
    description: item.summary ?? undefined,
    ...toChoreSchedule(item.due, config.SKYLIGHT_TIMEZONE),
    // Only the create_multiple endpoint accepts unassigned ("up for grabs") chores.
    ...(isAssigned ? { status: 'pending', category_id: categoryId } : { up_for_grabs: true })
  }
  logger.info({ itemId: item.id }, 'createChore')
  const body = await skylightRequest('POST', isAssigned ? '/chores' : '/chores/create_multiple', chore)
  return { choreId: getChoreId(body) }
}

// Chore IDs can be a plain ID (e.g. "18731133"), or include the date (and time) of one
// occurrence of a recurring chore (e.g. "18731133-2026-04-28" or "70190003-2026-04-28-0600").
const choreIdPattern = /^(\d+)-(\d{4}-\d{2}-\d{2})(?:-(\d{2})(\d{2}))?$/

// Skylight requires the profile (category) that completed the chore, even for "up for grabs" chores.
const getCompletedByCategoryId = (): string => {
  const config = getConfig()
  const completedBy = config.SKYLIGHT_COMPLETED_BY_CATEGORY_ID?.trim() ?? ''
  return completedBy !== '' ? completedBy : config.SKYLIGHT_CATEGORY_ID?.trim() ?? ''
}

export const completeChore = async (choreId: string, categoryId: string): Promise<void> => {
  const match = choreIdPattern.exec(choreId)
  const baseId = match === null ? choreId : match[1]
  const completion = {
    status: 'complete',
    category_id: categoryId,
    instance_date: match?.[2],
    instance_time: match?.[3] === undefined ? undefined : `${match[3]}:${match[4]}`
  }
  logger.info({ choreId }, 'completeChore')
  await skylightRequest('PUT', `/chores/${encodeURIComponent(baseId)}/completions`, completion)
}

// Marks all the chores the item was sent as complete. Tries all of them even if some fail.
const completeItemChores = async (item: Item): Promise<void> => {
  const choreIds = await getItemLinks(item.id, skylight.id)
  if (choreIds.length === 0) { return }
  const categoryId = getCompletedByCategoryId()
  if (categoryId === '') {
    throw new IntegrationError('Set SKYLIGHT_COMPLETED_BY_CATEGORY_ID (or SKYLIGHT_CATEGORY_ID) on the server to mark chores complete')
  }
  const results = await Promise.allSettled(choreIds.map(async choreId => await completeChore(choreId, categoryId)))
  const failure = results.find(result => result.status === 'rejected')
  if (failure !== undefined) {
    throw failure.reason
  }
}

const createChoreRequestSchema = z.object({
  itemId: z.string()
})

const createChoreController: Controller = async (req, res) => {
  const { itemId } = createChoreRequestSchema.parse(req.body ?? {})
  const item = await getItem(itemId)
  if (item.type !== 'task') {
    throw new ClientError('Only tasks can be sent to Skylight')
  }
  const result = await createChore(item)
  if (result.choreId !== '') {
    // So the chore can be completed when the item is checked off.
    await addItemLink(item.id, skylight.id, result.choreId)
  }
  res.status(201).json(result)
}

const router = Router()
/* eslint-disable @typescript-eslint/no-misused-promises -- async supported by Express v5 */
router.post('/chores', createChoreController)
/* eslint-enable @typescript-eslint/no-misused-promises */

const isSet = (value: string | undefined): boolean => (value ?? '').trim() !== ''

export const skylight: Integration = {
  id: 'skylight',
  name: 'Skylight Calendar',
  assertConfigured: (config: Config) => {
    if (!isSet(config.SKYLIGHT_FRAME_ID)) {
      throw new Error('SKYLIGHT_FRAME_ID must be set to enable the Skylight integration')
    }
    const hasAuthHeader = isSet(config.SKYLIGHT_AUTH_HEADER)
    const hasFingerprint = isSet(config.SKYLIGHT_DEVICE_FINGERPRINT)
    if (hasAuthHeader === hasFingerprint) {
      throw new Error('Set either SKYLIGHT_AUTH_HEADER, or SKYLIGHT_DEVICE_FINGERPRINT and SKYLIGHT_REFRESH_TOKEN, to enable the Skylight integration (not both)')
    }
    try {
      toChoreSchedule(null, config.SKYLIGHT_TIMEZONE)
    } catch {
      throw new Error(`SKYLIGHT_TIMEZONE "${config.SKYLIGHT_TIMEZONE}" is not a valid time zone`)
    }
  },
  router,
  onItemCompleted: completeItemChores,
  onScheduled: keepTokensAlive
}
