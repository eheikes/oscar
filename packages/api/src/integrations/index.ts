import { type Router } from 'express'
import { type Config, getConfig } from '../config.js'
import { UpstreamError } from '../error.js'
import type { Item } from '../items.js'
import { logger } from '../logger.js'
import { skylight } from './skylight.js'

export interface Integration {
  id: string
  name: string
  // Throws if the integration is enabled but its settings are missing or invalid.
  assertConfigured: (config: Config) => void
  // Mounted at /integrations/{id} when the integration is enabled.
  router: Router
  // Called after an item is checked off (soft-deleted). Throws if the integration couldn't be updated.
  onItemCompleted?: (item: Item) => Promise<void>
}

export interface IntegrationInfo {
  id: string
  name: string
}

// All the integrations that can be enabled with the INTEGRATIONS setting.
const availableIntegrations: Integration[] = [
  skylight
]

let enabledIntegrations: Integration[] | null = null

export const getEnabledIntegrations = (): Integration[] => {
  if (enabledIntegrations === null) {
    const config = getConfig()
    const ids = new Set(config.INTEGRATIONS.split(',').map(id => id.trim()).filter(id => id !== ''))
    const integrations = [...ids].map(id => {
      const integration = availableIntegrations.find(integration => integration.id === id)
      if (integration === undefined) {
        throw new Error(`Unknown integration "${id}" in INTEGRATIONS`)
      }
      integration.assertConfigured(config)
      return integration
    })
    enabledIntegrations = integrations
  }
  return enabledIntegrations
}

export const getIntegrations = (): IntegrationInfo[] => {
  return getEnabledIntegrations().map(({ id, name }) => ({ id, name }))
}

// Lets the enabled integrations know that an item was checked off.
// Failures don't undo the check-off; they're returned as warnings for the user instead.
export const notifyItemCompleted = async (item: Item): Promise<string[]> => {
  const warnings: string[] = []
  for (const integration of getEnabledIntegrations()) {
    if (integration.onItemCompleted === undefined) { continue }
    try {
      await integration.onItemCompleted(item)
    } catch (err) {
      logger.error({ err, itemId: item.id, integration: integration.id }, 'Integration failed to complete item')
      // Only pass on messages that are meant for the client.
      const reason = err instanceof UpstreamError ? `: ${err.message}` : ''
      warnings.push(`Could not mark the item as completed in ${integration.name}${reason}`)
    }
  }
  return warnings
}

// Helper function for tests
export const clearIntegrations = /* c8 ignore next */ (): void => {
  enabledIntegrations = null
}
