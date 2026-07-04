export interface ItemType {
  id: string
  readable: string
}

export interface Label {
  id: string
  readable: string
}

export interface Item {
  id: string
  title: string
  type: string
  createdAt: string
  updatedAt: string
  labels: string[]
  deletedAt: string | null
  due: string | null
  length: number | null
  parentId: string | null
  summary: string | null
  uri: string | null
}

export interface NextItemResult {
  item: Item
  reason: string
}

export interface GetItemsParams {
  count?: number
  offset?: number
  orderBy?: 'due' | 'createdAt'
  orderDir?: 'asc' | 'desc'
  type?: string
  label?: string | string[]
  search?: string
  since?: string
  includeDeleted?: boolean
}

export interface GetNextItemsParams {
  type: string
  count?: number
  label?: string
}

export interface CreateItemData {
  title: string
  type: string
  due?: string | null
  labels?: string[]
  length?: number | null
  parentId?: string | null
  summary?: string | null
  uri?: string | null
}

export interface UpdateItemData {
  title?: string
  type?: string
  due?: string | null
  labels?: string[]
  length?: number | null
  parentId?: string | null
  summary?: string | null
  uri?: string | null
  deletedAt?: string | null
}
