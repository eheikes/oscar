import type { CreateItemData, Item, UpdateItemData } from '../../../src/lib/types.js'
import { mockToken } from './auth.js'
import { apiBaseUrl, TEST_ITEM_MARKER } from './config.js'

// Talks to the API directly (not through the browser), for setting up and checking test data.
const apiFetch = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const res = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'mock-token': mockToken }
  })
  if (!res.ok) {
    throw new Error(`${options.method ?? 'GET'} ${path} returned ${res.status}: ${await res.text()}`)
  }
  return res.status === 204 ? (undefined as T) : await (res.json() as Promise<T>)
}

export const getItem = async (id: string): Promise<Item> => {
  return await apiFetch<Item>(`/items/${id}`)
}

export const createItem = async (data: CreateItemData): Promise<Item> => {
  return await apiFetch<Item>('/items', { method: 'POST', body: JSON.stringify(data) })
}

export const updateItem = async (id: string, data: UpdateItemData): Promise<Item> => {
  return await apiFetch<Item>(`/items/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export const findItems = async (search: string): Promise<Item[]> => {
  const qs = new URLSearchParams({ search, includeDeleted: 'true', count: '500', orderBy: 'createdAt' })
  return await apiFetch<Item[]>(`/items?${qs.toString()}`)
}

// Permanently removes the items whose titles match, children before parents.
export const deleteItems = async (search: string = TEST_ITEM_MARKER): Promise<void> => {
  let items = (await findItems(search)).filter(item => item.title.startsWith(TEST_ITEM_MARKER))
  while (items.length > 0) {
    const parentIds = new Set(items.map(item => item.parentId))
    const leaves = items.filter(item => !parentIds.has(item.id))
    if (leaves.length === 0) throw new Error('Could not delete test items (cyclic parents?)')
    for (const item of leaves) {
      await apiFetch(`/items/${item.id}`, { method: 'DELETE' })
    }
    items = items.filter(item => !leaves.includes(item))
  }
}
