import type { PageLoad } from './$types'
import { getRetroItems, getTypes, getLabels } from '$lib/api.js'
import type { Item, ItemType, Label } from '$lib/types.js'

const DEFAULT_DAYS = 7
const MS_PER_DAY = 24 * 60 * 60 * 1000

export const load: PageLoad = async ({ url }) => {
  const parsedDays = parseInt(url.searchParams.get('days') ?? String(DEFAULT_DAYS), 10)
  const selectedDays = Number.isNaN(parsedDays) || parsedDays <= 0 ? DEFAULT_DAYS : parsedDays
  const selectedType = url.searchParams.get('type') ?? ''
  const selectedLabels = url.searchParams.getAll('label')

  let types: ItemType[] = []
  let labels: Label[] = []
  try {
    [types, labels] = await Promise.all([getTypes(), getLabels()])
  } catch {
    // non-fatal
  }

  let items: Item[] = []
  let itemsError = ''
  try {
    items = await getRetroItems({
      since: new Date(Date.now() - selectedDays * MS_PER_DAY).toISOString(),
      type: selectedType !== '' ? selectedType : undefined,
      label: selectedLabels.length > 0 ? selectedLabels : undefined
    })
  } catch (err) {
    itemsError = err instanceof Error ? err.message : 'Failed to load items'
  }

  return { items, itemsError, types, labels, selectedDays, selectedType, selectedLabels }
}
