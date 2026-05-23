import { type ParsedQs } from 'qs'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import { getDatabaseConnection, Knex } from './database.js'
import { ClientError, NotFoundError } from './error.js'
import { addItemLabels, DatabaseItemLabel, getItemLabels } from './labels.js'

export interface DatabaseItem {
  author: string | null
  created_at: Date
  deleted_at: Date | null
  due: string | null
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
  author: z.string().nullish(),
  due: z.string().datetime().nullish(),
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

export const addItem = async (itemData: unknown): Promise<ItemWithLabels> => {
  const parsedItemData = addItemRequestSchema.parse(itemData)
  const db = getDatabaseConnection()
  const id = uuidv4()
  const now = new Date()
  await db('items').insert({
    author: parsedItemData.author,
    created_at: now,
    deleted_at: null,
    due: parsedItemData.due,
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
    due: parsedItemData.due ?? null,
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

const deleteItemRequestSchema = z.object({
  itemId: z.string().uuid()
})

export const deleteItem = async (itemId: string): Promise<void> => {
  deleteItemRequestSchema.parse({ itemId })
  const db = getDatabaseConnection()
  const result = await db.select('*').from('items').where({ id: itemId }).first()
  if (result === undefined) {
    throw new NotFoundError('Item not found')
  }
  if (result.deleted_at !== null) {
    // Item is already deleted, so don't update the deletion date.
    return
  }
  await db('items').update({ deleted_at: new Date() }).where({ id: itemId })
}

const getItemsRequestSchema = z.object({
  count: z.coerce.number().default(25),
  includeDeleted: z.coerce.boolean().default(false),
  maximumRank: z.coerce.number().optional(),
  minimumRank: z.coerce.number().optional(),
  offset: z.coerce.number().optional(),
  orderBy: z.string().default('createdAt'),
  orderDir: z.enum(['asc', 'desc']).default('desc'),
  random: z.coerce.boolean().default(false),
  search: z.string().optional(),
  since: z.string().datetime().optional(),
  type: z.union([z.array(z.string()), z.string()]).optional()
})

export const getItems = async (params: ParsedQs): Promise<ItemWithLabels[]> => {
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
  const db = getDatabaseConnection()
  const parsedParams = getNextItemRequestSchema.parse(params)
  const labels = Array.isArray(parsedParams.label)
    ? parsedParams.label
    : (typeof parsedParams.label === 'string' ? [parsedParams.label] : [])
  const limit = Math.min(parsedParams.count, 100)
  let query: Knex.QueryBuilder<DatabaseItem & DatabaseItemLabel> | Knex.QueryBuilder<DatabaseItem> = db.select('*')
    .from('items')
    .where('type_id', parsedParams.type)
    .whereNull('deleted_at')
    .limit(limit + 10) // get some extra items in case of weight adjustments
  if (labels.length > 0) {
    query = query
      .join('item_labels', 'items.id', 'item_labels.item_id')
      .whereIn('item_labels.label_id', labels)
  }
  if (parsedParams.type === 'task') {
    query = query.orderBy('due', 'ASC', 'last').orderBy('created_at', 'ASC')
  } else {
    query = query.orderBy('rank', 'DESC', 'last').orderBy('created_at', 'ASC')
  }
  const result = await query
  if (result.length === 0) {
    throw new NotFoundError('No items found')
  }
  const msPerDay = 86400000 // 1000ms * 60s * 60m * 24h
  const nearFuture = Date.now() * msPerDay * 14
  const farFuture = Date.now() * msPerDay * 100
  const lastItemDate = new Date(result[result.length - 1].due ?? farFuture)
  const daysSinceLastItem = lastItemDate.getTime() / msPerDay + (10 * 365) // only used for tasks
  let response: NextItemWithWeight[] = []
  for (const item of result) {
    const labels = await getItemLabels(item.id)
    let reason = ''
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
        reason = `This item has a rank of ${item.rank as number}.`
      }
    }
    response.push({
      item: { ...mapItemFromDatabase(item, labels.map(label => label.labelId)), weight },
      reason: reason.trim()
    })
  }
  response.sort((a, b) => (b.item.weight ?? 0) - (a.item.weight ?? 0))
  response = response.slice(0, limit).map(({ item, reason }) => ({
    item: { ...item, weight: undefined },
    reason
  }))
  console.log('**** results post-calc:', JSON.stringify(response, null, 2)) // TODO: convert to log
  return response
}
