import type { PageLoad } from './$types'
import { getItem, getTypes, getLabels } from '$lib/api.js'
import type { Item, ItemType, Label } from '$lib/types.js'

export const load: PageLoad = async ({ params }) => {
  let types: ItemType[] = []
  let labels: Label[] = []
  try {
    [types, labels] = await Promise.all([getTypes(), getLabels()])
  } catch {
    // non-fatal
  }

  let item: Item | null = null
  let itemError = ''
  try {
    item = await getItem(params.itemId)
  } catch (err) {
    itemError = err instanceof Error ? err.message : 'Failed to load item'
  }

  return { item, itemError, types, labels }
}
