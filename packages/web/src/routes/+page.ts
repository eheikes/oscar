import type { PageLoad } from './$types'
import { getItems, getTypes, getLabels } from '$lib/api.js'
import type { Item, ItemType, Label } from '$lib/types.js'

export const load: PageLoad = async ({ url }) => {
  const selectedType = url.searchParams.get('type') ?? ''
  const selectedLabels = url.searchParams.getAll('label')
  const selectedSearch = url.searchParams.get('search') ?? ''
  const selectedIncludeDeleted = url.searchParams.get('includeDeleted') === 'true'

  const orderByParam = url.searchParams.get('orderBy')
  const selectedOrderBy = orderByParam === 'createdAt' ? 'createdAt' : 'due'

  const orderDirParam = url.searchParams.get('orderDir')
  const selectedOrderDir = orderDirParam === 'desc' ? 'desc' : 'asc'

  const parsedCount = parseInt(url.searchParams.get('count') ?? '25', 10)
  const selectedCount = Number.isNaN(parsedCount) || parsedCount <= 0 ? 25 : parsedCount

  const hasFilters = url.searchParams.toString().length > 0

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
    items = await getItems({
      count: selectedCount,
      orderBy: selectedOrderBy,
      orderDir: selectedOrderDir,
      type: selectedType !== '' ? selectedType : undefined,
      label: selectedLabels.length > 0 ? selectedLabels : undefined,
      search: selectedSearch !== '' ? selectedSearch : undefined,
      includeDeleted: selectedIncludeDeleted
    })
  } catch (err) {
    itemsError = err instanceof Error ? err.message : 'Failed to load items'
  }

  return {
    items,
    itemsError,
    types,
    labels,
    hasFilters,
    selectedType,
    selectedLabels,
    selectedSearch,
    selectedIncludeDeleted,
    selectedOrderBy,
    selectedOrderDir,
    selectedCount
  }
}
