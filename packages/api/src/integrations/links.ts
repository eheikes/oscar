import { getDatabaseConnection } from '../database.js'

export interface DatabaseItemIntegrationLink {
  item_id: string
  integration_id: string
  external_id: string
  created_at: Date
}

declare module 'knex/types/tables.js' {
  interface Tables {
    item_integration_links: DatabaseItemIntegrationLink
  }
}

// Remembers that an item was sent to an integration, as the given external ID (e.g. a Skylight chore ID).
export const addItemLink = async (itemId: string, integrationId: string, externalId: string): Promise<void> => {
  const db = getDatabaseConnection()
  await db('item_integration_links')
    .insert({ item_id: itemId, integration_id: integrationId, external_id: externalId })
    .onConflict(['item_id', 'integration_id', 'external_id']).ignore()
}

// Returns the external IDs that an item was sent to an integration as, oldest first.
export const getItemLinks = async (itemId: string, integrationId: string): Promise<string[]> => {
  const db = getDatabaseConnection()
  const rows = await db.select('external_id').from('item_integration_links')
    .where({ item_id: itemId, integration_id: integrationId })
    .orderBy('created_at', 'asc')
  return rows.map(row => row.external_id)
}
