import { writable } from 'svelte/store'

export interface Toast {
  id: number
  kind: 'success' | 'error'
  message: string
  link?: { href: string, label: string }
}

const TOAST_DURATION_MS = 30000

let nextId = 1

// Oldest toast first, so they stack with the oldest on top.
export const toasts = writable<Toast[]>([])

export function showToast (toast: Omit<Toast, 'id'>): void {
  const id = nextId++
  toasts.update(list => [...list, { ...toast, id }])
  setTimeout(() => { dismissToast(id) }, TOAST_DURATION_MS)
}

export function dismissToast (id: number): void {
  toasts.update(list => list.filter(t => t.id !== id))
}
