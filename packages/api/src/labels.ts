import { getDatabaseConnection, type Knex } from './database.js'
import { ClientError } from './error.js'

export interface DatabaseLabel {
  id: string
  readable: string | null
}

export interface DatabaseItemLabel {
  item_id: string
  label_id: string
}

declare module 'knex/types/tables.js' {
  interface Tables {
    item_labels: DatabaseItemLabel
    labels: DatabaseLabel
  }
}

export interface ItemLabel {
  itemId: string
  labelId: string
}

export interface Label {
  id: string
  readable: string
}

export const assertLabelsExist = async (labelIds: string[]): Promise<void> => {
  if (labelIds.length === 0) { return }
  const db = getDatabaseConnection()
  const rows = await db.select('id').from('labels').whereIn('id', labelIds)
  const existing = new Set(rows.map(row => row.id))
  const invalid = labelIds.filter(labelId => !existing.has(labelId))
  if (invalid.length > 0) {
    throw new ClientError(`Invalid labels: ${invalid.map(labelId => `"${labelId}"`).join(', ')}`)
  }
}

export const addItemLabels = async (
  itemId: string,
  labelIds: string[],
  db: Knex = getDatabaseConnection() // pass a transaction to include the inserts in it
): Promise<void> => {
  for (const labelId of new Set(labelIds)) { // ignore duplicates
    await db('item_labels').insert({ item_id: itemId, label_id: labelId })
  }
}

export const getItemLabels = async (itemId: string): Promise<ItemLabel[]> => {
  const db = getDatabaseConnection()
  const query = db.select('*').from('item_labels').where({ item_id: itemId }).limit(100)
  const result = await query
  return result.map(row => ({
    itemId: row.item_id,
    labelId: row.label_id
  }))
}

export const getLabels = async (): Promise<Label[]> => {
  const db = getDatabaseConnection()
  const query = db.select('*').from('labels').orderBy('id', 'ASC').limit(100)
  const result = await query
  return result.map(row => ({
    id: row.id,
    readable: row.readable ?? row.id
  }))
}
