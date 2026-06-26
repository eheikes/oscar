import { type ParsedQs } from 'qs'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import { getConfig } from './config.js'
import { getDatabaseConnection, raw } from './database.js'
import { ClientError, NotFoundError } from './error.js'
import { addItemLabels, getItemLabels } from './labels.js'
import { logger } from './logger.js'

const config = getConfig()

export interface DatabaseItem {
  author: string | null
  created_at: Date
  deleted_at: Date | null
  due: Date | null
  expected_rank: number | null
  id: string
  image_uri: string | null
  language: string | null
  length: number | null
  rank: number | null
  rating: number | null
  summary: string | null
  title: string
  type_id: string
  updated_at: Date
  uri: string | null
}

export interface DatabaseItemWithLabels extends DatabaseItem {
  labels: string[]
}

declare module 'knex/types/tables.js' {
  interface Tables {
    items: DatabaseItem
  }
}

export interface Item {
  author: string | null
  createdAt: string
  deletedAt: string | null
  due: string | null
  expectedRank: number | null
  id: string
  imageUri: string | null
  language: string | null
  length: number | null
  rank: number | null
  rating: number | null
  summary: string | null
  title: string
  type: string
  updatedAt: string
  uri: string | null
}

export interface ItemWithLabels extends Item {
  labels: string[]
}

const itemFieldMapping: Record<keyof Item, keyof DatabaseItem> = {
  author: 'author',
  createdAt: 'created_at',
  deletedAt: 'deleted_at',
  due: 'due',
  expectedRank: 'expected_rank',
  id: 'id',
  imageUri: 'image_uri',
  language: 'language',
  length: 'length',
  rank: 'rank',
  rating: 'rating',
  summary: 'summary',
  title: 'title',
  type: 'type_id',
  updatedAt: 'updated_at',
  uri: 'uri'
}

const isItemField = (name: string): name is keyof Item => {
  return Object.keys(itemFieldMapping).includes(name)
}

const mapItemFromDatabase = (row: DatabaseItem, labels: string[] = []): ItemWithLabels => {
  return {
    author: row.author,
    createdAt: new Date(row.created_at).toISOString(),
    deletedAt: row.deleted_at === null ? /* c8 ignore next */ null : new Date(row.deleted_at).toISOString(),
    due: row.due === null ? /* c8 ignore next */ null : new Date(row.due).toISOString(),
    expectedRank: row.expected_rank,
    id: row.id,
    imageUri: row.image_uri,
    labels,
    language: row.language,
    length: row.length,
    rank: row.rank,
    rating: row.rating,
    summary: row.summary,
    title: row.title,
    type: row.type_id,
    updatedAt: new Date(row.updated_at).toISOString(),
    uri: row.uri
  }
}

const addItemRequestSchema = z.object({
  replace: z.string().optional()
})

const addItemBodySchema = z.object({
  author: z.string().nullish(),
  due: z.string().datetime({ offset: true }).nullish(),
  expectedRank: z.number().nullish(),
  imageUri: z.string().nullish(),
  labels: z.array(z.string()).nullish(),
  language: z.string().nullish(),
  length: z.number().nullish(),
  rank: z.number().nullish(),
  rating: z.number().nullish(),
  summary: z.string().nullish(),
  title: z.string(),
  type: z.string(),
  uri: z.string().nullish()
})

export const addItem = async (params: ParsedQs, itemData: unknown): Promise<ItemWithLabels> => {
  logger.info({ params, itemData }, 'addItem')
  const parsedParams = addItemRequestSchema.parse(params)
  const parsedItemData = addItemBodySchema.parse(itemData)
  const db = getDatabaseConnection()
  if (parsedParams.replace === 'true') {
    // Delete rather than mark deleted_at so as to not interfere with getNextItem()
    await db('items').where({
      title: parsedItemData.title,
      type_id: parsedItemData.type
    }).whereNull('deleted_at').delete()
  }
  const id = uuidv4()
  const now = new Date()
  await db('items').insert({
    author: parsedItemData.author,
    created_at: now,
    deleted_at: null,
    due: typeof parsedItemData.due === 'string' ? new Date(parsedItemData.due) : null,
    expected_rank: parsedItemData.expectedRank,
    id,
    image_uri: parsedItemData.imageUri,
    language: parsedItemData.language,
    length: parsedItemData.length,
    rank: parsedItemData.rank,
    rating: parsedItemData.rating,
    summary: parsedItemData.summary,
    title: parsedItemData.title,
    type_id: parsedItemData.type,
    updated_at: now,
    uri: parsedItemData.uri
  })
  if (Array.isArray(parsedItemData.labels)) {
    await addItemLabels(id, parsedItemData.labels)
  }
  return {
    author: parsedItemData.author ?? null,
    createdAt: now.toISOString(),
    deletedAt: null,
    due: typeof parsedItemData.due === 'string' ? new Date(parsedItemData.due).toISOString() : null,
    expectedRank: parsedItemData.expectedRank ?? null,
    id,
    imageUri: parsedItemData.imageUri ?? null,
    labels: parsedItemData.labels ?? [],
    language: parsedItemData.language ?? null,
    length: parsedItemData.length ?? null,
    rank: parsedItemData.rank ?? null,
    rating: parsedItemData.rating ?? null,
    summary: parsedItemData.summary ?? null,
    title: parsedItemData.title ?? null,
    type: parsedItemData.type,
    updatedAt: now.toISOString(),
    uri: parsedItemData.uri ?? null
  }
}

const removeItemRequestSchema = z.object({
  itemId: z.string().uuid()
})

export const deleteItem = async (itemId: string): Promise<void> => {
  logger.info({ itemId }, 'deleteItem')
  removeItemRequestSchema.parse({ itemId })
  const db = getDatabaseConnection()
  const result = await db.select('*').from('items').where({ id: itemId }).first()
  if (result === undefined) {
    throw new NotFoundError('Item not found')
  }
  await db('items').where({ id: itemId }).delete()
}

const updateItemParamsSchema = z.object({
  itemId: z.string().uuid()
})

const updateItemBodySchema = z.object({
  author: z.string().nullable().optional(),
  deletedAt: z.string().datetime({ offset: true }).nullable().optional(),
  due: z.string().datetime({ offset: true }).nullable().optional(),
  expectedRank: z.number().nullable().optional(),
  imageUri: z.string().nullable().optional(),
  labels: z.array(z.string()).optional(),
  language: z.string().nullable().optional(),
  length: z.number().nullable().optional(),
  rank: z.number().nullable().optional(),
  rating: z.number().nullable().optional(),
  summary: z.string().nullable().optional(),
  title: z.string().optional(),
  type: z.string().optional(),
  uri: z.string().nullable().optional()
}).strict()

export const updateItem = async (itemId: string, itemData: unknown): Promise<ItemWithLabels> => {
  logger.info({ itemId, itemData }, 'updateItem')
  updateItemParamsSchema.parse({ itemId })
  const parsedItemData = updateItemBodySchema.parse(itemData)
  const db = getDatabaseConnection()
  const existing = await db.select('*').from('items').where({ id: itemId }).first()
  if (existing === undefined) {
    throw new NotFoundError('Item not found')
  }
  const now = new Date()
  const dbUpdates: Partial<DatabaseItem> = { updated_at: now }
  if (parsedItemData.author !== undefined) dbUpdates.author = parsedItemData.author
  if (parsedItemData.deletedAt !== undefined) {
    dbUpdates.deleted_at = parsedItemData.deletedAt === null ? null : new Date(parsedItemData.deletedAt)
  }
  if (parsedItemData.due !== undefined) dbUpdates.due = parsedItemData.due === null ? null : new Date(parsedItemData.due)
  if (parsedItemData.expectedRank !== undefined) dbUpdates.expected_rank = parsedItemData.expectedRank
  if (parsedItemData.imageUri !== undefined) dbUpdates.image_uri = parsedItemData.imageUri
  if (parsedItemData.language !== undefined) dbUpdates.language = parsedItemData.language
  if (parsedItemData.length !== undefined) dbUpdates.length = parsedItemData.length
  if (parsedItemData.rank !== undefined) dbUpdates.rank = parsedItemData.rank
  if (parsedItemData.rating !== undefined) dbUpdates.rating = parsedItemData.rating
  if (parsedItemData.summary !== undefined) dbUpdates.summary = parsedItemData.summary
  if (parsedItemData.title !== undefined) dbUpdates.title = parsedItemData.title
  if (parsedItemData.type !== undefined) dbUpdates.type_id = parsedItemData.type
  if (parsedItemData.uri !== undefined) dbUpdates.uri = parsedItemData.uri
  await db('items').update(dbUpdates).where({ id: itemId })
  if (parsedItemData.labels !== undefined) {
    await db('item_labels').where({ item_id: itemId }).delete()
    await addItemLabels(itemId, parsedItemData.labels)
  }
  const updatedRow = await db.select('*').from('items').where({ id: itemId }).first()
  const itemLabels = await getItemLabels(itemId)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return mapItemFromDatabase(updatedRow!, itemLabels.map(label => label.labelId))
}

const getItemsRequestSchema = z.object({
  count: z.coerce.number().default(25),
  includeDeleted: z.coerce.boolean().default(false),
  label: z.union([z.array(z.string()), z.string()]).optional(),
  maximumRank: z.coerce.number().optional(),
  minimumRank: z.coerce.number().optional(),
  offset: z.coerce.number().optional(),
  orderBy: z.string().default('due'),
  orderDir: z.enum(['asc', 'desc']).default('asc'),
  random: z.coerce.boolean().default(false),
  search: z.string().optional(),
  since: z.string().datetime({ offset: true }).optional(),
  type: z.union([z.array(z.string()), z.string()]).optional()
})

export const getItems = async (params: ParsedQs): Promise<ItemWithLabels[]> => {
  logger.info({ params }, 'getItems')
  const parsedParams = getItemsRequestSchema.parse(params)
  const db = getDatabaseConnection()
  let query = db.select('*').from('items')
  if (!parsedParams.includeDeleted) {
    query = query.whereNull('deleted_at')
  }
  if (typeof parsedParams.maximumRank !== 'undefined') {
    query = query.where('rank', '<=', parsedParams.maximumRank)
  }
  if (typeof parsedParams.minimumRank !== 'undefined') {
    query = query.where('rank', '>=', parsedParams.minimumRank)
  }
  if (typeof parsedParams.since !== 'undefined') {
    query = query.where('created_at', '>=', parsedParams.since)
  }
  if (typeof parsedParams.type !== 'undefined') {
    query = query.andWhere((builder) => {
      const typeParam = parsedParams.type as string | string[]
      const types = Array.isArray(typeParam) ? typeParam : [typeParam]
      for (const type of types) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        builder.orWhere('type_id', type)
      }
    })
  }
  if (typeof parsedParams.label !== 'undefined') {
    const labelParam = parsedParams.label
    const labels = Array.isArray(labelParam) ? labelParam : [labelParam]
    for (const label of labels) {
      query = query.whereExists(function () {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.select(raw('1')).from('item_labels').whereRaw('items.id = item_labels.item_id').where('label_id', label)
      })
    }
  }
  if (typeof parsedParams.search !== 'undefined') {
    const terms = parsedParams.search.split(/\s+/)
    for (const term of terms) {
      query = query.whereILike('title', `%${term}%`)
    }
  }
  if (parsedParams.orderBy === 'random') {
    query = query.orderByRaw('random()')
  } else if (isItemField(parsedParams.orderBy)) {
    query = query.orderBy(itemFieldMapping[parsedParams.orderBy], parsedParams.orderDir)
  } else {
    throw new ClientError(`"${parsedParams.orderBy}" is not a valid field`)
  }
  if (typeof parsedParams.offset !== 'undefined') {
    query = query.offset(parsedParams.offset)
  }
  query = query.limit(Math.min(parsedParams.count, 100))
  const result = await query
  const items: ItemWithLabels[] = await Promise.all(result.map(async item => {
    const labels = await getItemLabels(item.id)
    return mapItemFromDatabase(item, labels.map(label => label.labelId))
  }))
  return items
}

const getNextItemRequestSchema = z.object({
  count: z.coerce.number().default(1),
  label: z.union([z.array(z.string()), z.string()]).optional(),
  type: z.string()
})

interface ItemWithLabelsAndWeight extends ItemWithLabels {
  weight?: number
}

interface NextItem {
  item: ItemWithLabels
  reason: string
}

interface NextItemWithWeight {
  item: ItemWithLabelsAndWeight
  reason: string
}

export const getNextItem = async (params: ParsedQs): Promise<NextItem[]> => {
  logger.info({ params }, 'getNextItem')
  const db = getDatabaseConnection()
  const parsedParams = getNextItemRequestSchema.parse(params)
  const WORK_CHUNK_SIZE = config.WORK_CHUNK_SIZE

  // Start building the query to get candidate items based on type and labels.
  // We'll calculate weights and reasons in JS since the logic is complex and involves multiple fields and labels.
  const labels = Array.isArray(parsedParams.label)
    ? parsedParams.label
    : (typeof parsedParams.label === 'string' ? [parsedParams.label] : [])
  const limit = Math.min(parsedParams.count, 100)
  let query = db.select('*')
    .from('items')
    .where('type_id', parsedParams.type)
    .whereNull('deleted_at')
    .limit(limit + 10) // get some extra items in case of weight adjustments
  if (labels.length > 0) {
    query = query.whereExists(function () {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.select(raw('1')).from('item_labels').whereRaw('items.id = item_labels.item_id').whereIn('label_id', labels)
    })
  }

  let baseReason = ''
  if (parsedParams.type === 'task') {
    // Get the most recent completed items.
    const completedSubquery = db('item_labels').select(raw('ARRAY_AGG(label_id)')).where('item_id', db.ref('items.id'))
    const completedQuery = db
      .select([
        'items.*',
        raw(`(${completedSubquery.toQuery()}) AS labels`)
      ])
      .from('items')
      .where('items.type_id', parsedParams.type)
      .whereNotNull('items.deleted_at')
      .orderBy('items.deleted_at', 'DESC')
      .limit(Math.ceil(WORK_CHUNK_SIZE / 5) + 1)
    for (const label of labels) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      completedQuery.whereExists(function () {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.select(raw('1')).from('item_labels').whereRaw('items.id = item_labels.item_id').where('label_id', label)
      })
    }
    const completedItems = await completedQuery
    logger.debug({ completedItems }, 'Completed items for next-item selection')

    // Rotate through these types of tasks:
    // * overdue busywork
    // * due-today busywork
    // * important (non-busywork) tasks
    if (completedItems.length > 0) {
      const isBusywork = (item: DatabaseItemWithLabels): boolean => {
        return item.labels.includes('busywork')
      }
      const isImportant = (item: DatabaseItemWithLabels): boolean => {
        return item.labels.includes('important')
      }
      const isDueToday = (item: DatabaseItemWithLabels): boolean => {
        if (item.due === null) {
          return false
        }
        const dueDate = new Date(item.due)
        const today = new Date()
        return dueDate.getFullYear() === today.getFullYear() &&
          dueDate.getMonth() === today.getMonth() &&
          dueDate.getDate() === today.getDate()
      }
      const isOverdue = (item: DatabaseItemWithLabels): boolean => {
        if (item.due === null) {
          return false
        }
        const dueDate = new Date(item.due)
        const now = new Date()
        return dueDate.getTime() < now.getTime()
      }
      const doCompletedItemsMatch = (items: DatabaseItemWithLabels[], condition: (item: DatabaseItemWithLabels) => boolean, chunkSize: number = 0): boolean => {
        let workSize = 0

        // If the first item doesn't match the condition, it doesn't satisfy.
        if (!condition(items[0])) {
          return false
        }

        // Make sure enough work has been completed.
        for (const item of items) {
          if (!condition(item)) {
            break
          }
          workSize += item.length ?? 0
        }

        return workSize >= chunkSize
      }
      if (doCompletedItemsMatch(completedItems, isImportant)) {
        // Choose an overdue busywork item.
        baseReason = 'Most recent completed item is important, looking for overdue busywork.'
        query = query
          .whereExists(function () {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            this.select(raw('1')).from('item_labels').whereRaw('items.id = item_labels.item_id').where('label_id', 'busywork')
          })
          .where('due', '<', new Date().toISOString())
      } else if (doCompletedItemsMatch(completedItems, item => isBusywork(item) && isDueToday(item))) {
        if (doCompletedItemsMatch(completedItems, item => isBusywork(item) && isDueToday(item), WORK_CHUNK_SIZE)) {
          // Choose an important item.
          baseReason = 'Most recent completed item is busywork due today, looking for important items.'
          query = query
            .whereExists(function () {
              // eslint-disable-next-line @typescript-eslint/no-floating-promises
              this.select(raw('1')).from('item_labels').whereRaw('items.id = item_labels.item_id').where('label_id', 'important')
            })
        } else {
          // Choose another busywork item due today.
          baseReason = 'Currently working through a chunk of busywork due today.'
          const sod = new Date()
          sod.setHours(0, 0, 0, 0)
          const eod = new Date()
          eod.setHours(23, 59, 59, 999)
          query = query
            .whereExists(function () {
              // eslint-disable-next-line @typescript-eslint/no-floating-promises
              this.select(raw('1')).from('item_labels').whereRaw('items.id = item_labels.item_id').where('label_id', 'busywork')
            })
            .where('due', '>=', sod.toISOString())
            .where('due', '<=', eod.toISOString())
        }
      } else if (doCompletedItemsMatch(completedItems, item => isBusywork(item) && isOverdue(item))) {
        if (doCompletedItemsMatch(completedItems, item => isBusywork(item) && isOverdue(item), WORK_CHUNK_SIZE)) {
          // Choose a busywork item due today.
          baseReason = 'Most recent completed item is overdue busywork, looking for busywork due today.'
          const sod = new Date()
          sod.setHours(0, 0, 0, 0)
          const eod = new Date()
          eod.setHours(23, 59, 59, 999)
          query = query
            .whereExists(function () {
              // eslint-disable-next-line @typescript-eslint/no-floating-promises
              this.select(raw('1')).from('item_labels').whereRaw('items.id = item_labels.item_id').where('label_id', 'busywork')
            })
            .where('due', '>=', sod.toISOString())
            .where('due', '<=', eod.toISOString())
        } else {
          // Choose another overdue busywork item.
          baseReason = 'Currently working through a chunk of overdue busywork.'
          query = query
            .whereExists(function () {
              // eslint-disable-next-line @typescript-eslint/no-floating-promises
              this.select(raw('1')).from('item_labels').whereRaw('items.id = item_labels.item_id').where('label_id', 'busywork')
            })
            .where('due', '<', new Date().toISOString())
        }
      } else {
        baseReason = 'No matching conditions found, using default logic.'
        // Choose a busywork item due today.
        const sod = new Date()
        sod.setHours(0, 0, 0, 0)
        const eod = new Date()
        eod.setHours(23, 59, 59, 999)
        query = query
          .whereExists(function () {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            this.select(raw('1')).from('item_labels').whereRaw('items.id = item_labels.item_id').where('label_id', 'busywork')
          })
          .where('due', '>=', sod.toISOString())
          .where('due', '<=', eod.toISOString())
      }
    }

    // By default, order by due date and creation date.
    query = query.orderBy('due', 'ASC', 'last').orderBy('created_at', 'ASC')
  } else {
    // For non-task items, rank is the primary ordering factor, with created_at as a tiebreaker.
    query = query.orderBy('rank', 'DESC', 'last').orderBy('created_at', 'ASC')
  }
  logger.debug({ query: query.toSQL() }, 'Next-item query')

  // Execute the query and check the results.
  const result = await query
  if (result.length === 0) {
    throw new NotFoundError('No items found')
  }

  // Go through the results and calculate weights and reasons for each item based on the decision logic.
  const msPerDay = 86400000 // 1000ms * 60s * 60m * 24h
  const nearFuture = Date.now() * msPerDay * 14
  const farFuture = Date.now() * msPerDay * 100
  const lastItemDate = new Date(result[result.length - 1].due ?? farFuture)
  const daysSinceLastItem = lastItemDate.getTime() / msPerDay + (10 * 365) // only used for tasks
  let response: NextItemWithWeight[] = []
  for (const item of result) {
    const labels = await getItemLabels(item.id)
    let reason = baseReason
    let weight = 0
    if (item.type_id === 'task') {
      let relativeDueDate = 0
      if (item.due === null) {
        relativeDueDate = nearFuture
        reason += ' This item has no due date.'
      } else {
        relativeDueDate = new Date(item.due).getTime() / msPerDay
      }
      if (labels.some(label => label.labelId === 'urgent')) {
        relativeDueDate -= 5
        reason += ' This item is labeled urgent.'
      } else if (labels.some(label => label.labelId === 'busywork')) {
        relativeDueDate -= 3
        reason += ' This item is labeled busywork.'
      } else if (labels.some(label => label.labelId === 'trivial')) {
        relativeDueDate += 5
        reason += ' This item is labeled trivial.'
      }
      if (reason === '') {
        reason = 'This item is next in order.'
      }
      weight = daysSinceLastItem - relativeDueDate
    } else {
      if (item.rank === null) {
        weight = 0
        reason = 'This is the next-oldest item.'
      } else {
        weight = item.rank
        reason = `This item has a rank of ${item.rank}.`
      }
    }
    response.push({
      item: { ...mapItemFromDatabase(item, labels.map(label => label.labelId)), weight },
      reason: reason.trim()
    })
  }

  // Sort the items by their weights.
  response.sort((a, b) => (b.item.weight ?? 0) - (a.item.weight ?? 0))
  response = response.slice(0, limit).map(({ item, reason }) => ({
    item: { ...item, weight: undefined },
    reason
  }))
  logger.debug({ response }, 'Next-item results post-calc')

  return response
}
