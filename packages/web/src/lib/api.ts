import type {
  Item,
  ItemType,
  Label,
  NextItemResult,
  GetItemsParams,
  GetNextItemsParams,
  CreateItemData,
  UpdateItemData
} from './types.js'

const BASE_URL: string = import.meta.env.VITE_API_BASE_URL

async function apiFetch<T> (path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    }
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API ${res.status}: ${text}`)
  }
  return await (res.json() as Promise<T>)
}

export async function getItems (params: GetItemsParams = {}): Promise<Item[]> {
  const qs = new URLSearchParams()
  if (params.count != null) qs.set('count', String(params.count))
  if (params.offset != null) qs.set('offset', String(params.offset))
  if (params.orderBy !== undefined) qs.set('orderBy', params.orderBy)
  if (params.orderDir !== undefined) qs.set('orderDir', params.orderDir)
  if (params.type !== undefined) qs.set('type', params.type)
  if (params.label !== undefined) {
    if (Array.isArray(params.label)) {
      params.label.forEach(l => qs.append('label', l))
    } else {
      qs.set('label', params.label)
    }
  }
  if (params.search !== undefined) qs.set('search', params.search)
  if (params.since !== undefined) qs.set('since', params.since)
  // Only include includeDeleted in query if explicitly true; API defaults to false
  if (params.includeDeleted === true) qs.set('includeDeleted', 'true')
  return await apiFetch<Item[]>(`/items?${qs.toString()}`)
}

export async function getNextItems (params: GetNextItemsParams): Promise<NextItemResult[]> {
  const qs = new URLSearchParams({ type: params.type })
  if (params.count != null) qs.set('count', String(params.count))
  if (params.label !== undefined) qs.set('label', params.label)
  return await apiFetch<NextItemResult[]>(`/items/next?${qs.toString()}`)
}

export async function getTypes (): Promise<ItemType[]> {
  return await apiFetch<ItemType[]>('/types')
}

export async function getLabels (): Promise<Label[]> {
  return await apiFetch<Label[]>('/labels')
}

export async function createItem (data: CreateItemData): Promise<Item> {
  return await apiFetch<Item>('/items', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateItem (id: string, data: UpdateItemData): Promise<Item> {
  return await apiFetch<Item>(`/items/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}
