import type {
  Item,
  ItemType,
  Label,
  NextItemResult,
  GetItemsParams,
  GetNextItemsParams,
  CreateItemData,
  UpdateItemData,
} from './types.js';

const BASE_URL: string = import.meta.env.API_BASE_URL;

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function getItems(params: GetItemsParams = {}): Promise<Item[]> {
  const qs = new URLSearchParams();
  if (params.count != null) qs.set('count', String(params.count));
  if (params.offset != null) qs.set('offset', String(params.offset));
  if (params.orderBy) qs.set('orderBy', params.orderBy);
  if (params.orderDir) qs.set('orderDir', params.orderDir);
  if (params.type) qs.set('type', params.type);
  if (params.label) {
    if (Array.isArray(params.label)) {
      params.label.forEach(l => qs.append('label', l));
    } else {
      qs.set('label', params.label);
    }
  }
  if (params.search) qs.set('search', params.search);
  if (params.since) qs.set('since', params.since);
  // Only include includeDeleted in query if explicitly true; API defaults to false
  if (params.includeDeleted === true) qs.set('includeDeleted', 'true');
  return apiFetch<Item[]>(`/items?${qs}`);
}

export async function getNextItems(params: GetNextItemsParams): Promise<NextItemResult[]> {
  const qs = new URLSearchParams({ type: params.type });
  if (params.count != null) qs.set('count', String(params.count));
  if (params.label) qs.set('label', params.label);
  return apiFetch<NextItemResult[]>(`/items/next?${qs}`);
}

export async function getTypes(): Promise<ItemType[]> {
  return apiFetch<ItemType[]>('/types');
}

export async function getLabels(): Promise<Label[]> {
  return apiFetch<Label[]>('/labels');
}

export async function createItem(data: CreateItemData): Promise<Item> {
  return apiFetch<Item>('/items', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateItem(id: string, data: UpdateItemData): Promise<Item> {
  return apiFetch<Item>(`/items/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
