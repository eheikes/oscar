import { getDatabaseConnection } from './database.js'

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

export const addItemLabels = async (itemId: string, labelIds: string[]): Promise<void> => {
  const db = getDatabaseConnection()
  for (const labelId of labelIds) {
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
