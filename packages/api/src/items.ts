import { type ParsedQs } from 'qs'
import { z } from 'zod'
import { getDatabaseConnection } from './database.js'

declare module 'knex/types/tables.js' {
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

const getItemsRequestSchema = z.object({
  count: z.coerce.number().default(25),
  includeDeleted: z.coerce.boolean().default(false),
  maximumRank: z.coerce.number().optional(),
  minimumRank: z.coerce.number().optional(),
  offset: z.coerce.number().optional(),
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
  if (parsedParams.random) {
    query = query.orderByRaw('random()')
  }
  if (typeof parsedParams.offset !== 'undefined') {
    query = query.offset(parsedParams.offset)
  }
  query = query.limit(Math.min(parsedParams.count, 100))
  const result = await query
  return result.map(row => ({
    author: row.author,
    createdAt: new Date(row.created_at),
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : /* c8 ignore next */ null,
    due: row.due ? new Date(row.due) : /* c8 ignore next */ null,
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
