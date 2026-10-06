import { type ParsedQs } from 'qs'
import { getDatabaseConnection } from './database.js'
import { ClientError } from './error.js'

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

export const assertTypeExists = async (typeId: string): Promise<void> => {
  const db = getDatabaseConnection()
  const row = await db.select('id').from('types').where({ id: typeId }).first()
  if (row === undefined) {
    throw new ClientError(`"${typeId}" is not a valid type`)
  }
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
