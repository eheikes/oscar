import { derived, writable } from 'svelte/store'
import { getIntegrations, sendToSkylight } from './api.js'
import { showToast } from './toasts.js'
import type { Integration } from './types.js'

// The integrations enabled on the API server. Empty until loaded (or if loading fails),
// so integration features stay hidden unless the server says they're available.
export const integrations = writable<Integration[]>([])

export const skylightEnabled = derived(integrations, list => list.some(i => i.id === 'skylight'))

// Only tasks can be sent to Skylight.
export const SKYLIGHT_ITEM_TYPE = 'task'

let loading: Promise<void> | null = null

export async function loadIntegrations (): Promise<void> {
  loading ??= getIntegrations()
    .then(list => { integrations.set(list) })
    .catch(err => {
      console.error('Failed to load integrations', err)
      loading = null // try again next time
    })
  await loading
}

// Sends an item to Skylight as a chore, and reports the result with a toast.
// Returns whether it succeeded.
export async function sendItemToSkylight (item: { id: string, title: string }): Promise<boolean> {
  try {
    await sendToSkylight(item.id)
    showToast({ kind: 'success', message: `Sent "${item.title}" to Skylight.` })
    return true
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    showToast({ kind: 'error', message: `Failed to send "${item.title}" to Skylight: ${msg}` })
    return false
  }
}
