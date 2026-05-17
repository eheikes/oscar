import { type ParsedQs } from 'qs'
import { getDatabaseConnection } from './database.js'

export interface DatabaseItemType {
  id: string
  readable: string | null
}

declare module 'knex/types/tables.js' {
  interface Tables {
    types: DatabaseItemType
  }
}

export interface ItemType {
  id: string
  readable: string
}

export const getTypes = async (_params: ParsedQs): Promise<ItemType[]> => {
  const db = getDatabaseConnection()
  const query = db.select('*').from('types').limit(100)
  const result = await query
  return result.map(row => ({
    id: row.id,
    readable: row.readable ?? row.id
  }))
}
