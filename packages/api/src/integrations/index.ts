import { type Router } from 'express'
import { type Config, getConfig } from '../config.js'
import { skylight } from './skylight.js'

export interface Integration {
  id: string
  name: string
  // Throws if the integration is enabled but its settings are missing or invalid.
  assertConfigured: (config: Config) => void
  // Mounted at /integrations/{id} when the integration is enabled.
  router: Router
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

// Helper function for tests
export const clearIntegrations = /* c8 ignore next */ (): void => {
  enabledIntegrations = null
}
