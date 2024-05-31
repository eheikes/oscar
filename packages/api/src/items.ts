import { type ParsedQs } from 'qs'
import { z } from 'zod'
import { getDatabaseConnection } from './database.js'
import { ClientError } from './error.js'

export interface DatabaseItem {
  author: string | null
  created_at: string
  deleted_at: string | null
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
  updated_at: string
  uri: string
}

declare module 'knex/types/tables.js' {
  interface Tables {
    items: DatabaseItem
  }
}

export interface Item {
  author: string | null
  createdAt: Date
  deletedAt: Date | null
  due: Date | null
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
  updatedAt: Date
  uri: string
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

export const getItems = async (params: ParsedQs): Promise<Item[]> => {
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
  return result.map(row => ({
    author: row.author,
    createdAt: new Date(row.created_at),
    deletedAt: row.deleted_at === null ? /* c8 ignore next */ null : new Date(row.deleted_at),
    due: row.due === null ? /* c8 ignore next */ null : new Date(row.due),
    expectedRank: row.expected_rank,
    id: row.id,
    imageUri: row.image_uri,
    language: row.language,
    length: row.length,
    rank: row.rank,
    rating: row.rating,
    summary: row.summary,
    title: row.title,
    type: row.type_id,
    updatedAt: new Date(row.updated_at),
    uri: row.uri
  }))
}
