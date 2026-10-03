import type {
  Item,
  ItemType,
  Label,
  NextItemResult,
  GetItemsParams,
  GetNextItemsParams,
  GetRetroItemsParams,
  CreateItemData,
  UpdateItemData
} from './types.js'
import { getAccessToken, authStore, redirectToLogin, SESSION_EXPIRED_MESSAGE } from './auth.js'

const BASE_URL: string = import.meta.env.VITE_API_BASE_URL
const REQUEST_TIMEOUT_MS = 20000

async function apiFetch<T> (path: string, options?: RequestInit): Promise<T> {
  const accessToken = await getAccessToken()
  if (accessToken === null) {
    authStore.update(state => ({
      ...state,
      isAuthenticated: false,
      accessToken: null,
      user: null,
      error: SESSION_EXPIRED_MESSAGE
    }))
    redirectToLogin()
    throw new Error(SESSION_EXPIRED_MESSAGE)
  }

  const headers = new Headers({ 'Content-Type': 'application/json' })
  new Headers(options?.headers).forEach((value, key) => headers.set(key, value))
  headers.set('Authorization', `Bearer ${accessToken}`)

  // Don't let the UI wait forever if the API hangs.
  const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  const signal = options?.signal != null
    ? AbortSignal.any([options.signal, timeoutSignal])
    : timeoutSignal

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    signal
  })

  if (res.status === 401) {
    let errorMsg = 'Unauthorized - session expired or invalid token'
    try {
      const data = await res.json()
      if (typeof data === 'object' && data !== null && typeof data.error === 'string') {
        errorMsg = data.error
      }
    } catch {
      // ignore if response is not JSON
    }
    console.error(`API ${res.status}: ${errorMsg}`)

    authStore.update(state => ({
      ...state,
      isAuthenticated: false,
      accessToken: null,
      user: null,
      error: SESSION_EXPIRED_MESSAGE
    }))
    try {
      sessionStorage.setItem('auth_error', SESSION_EXPIRED_MESSAGE)
    } catch {
      // ignore
    }
    redirectToLogin()
    throw new Error(SESSION_EXPIRED_MESSAGE)
  }

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

export async function getRetroItems (params: GetRetroItemsParams = {}): Promise<Item[]> {
  const qs = new URLSearchParams()
  if (params.since !== undefined) qs.set('since', params.since)
  const types = params.type === undefined ? [] : Array.isArray(params.type) ? params.type : [params.type]
  types.forEach(t => qs.append('type', t))
  const labels = params.label === undefined ? [] : Array.isArray(params.label) ? params.label : [params.label]
  labels.forEach(l => qs.append('label', l))
  return await apiFetch<Item[]>(`/items/retro?${qs.toString()}`)
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
