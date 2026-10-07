import type { Locator, Page } from '@playwright/test'
import { createItem, getItem } from './helpers/api.js'
import { expect, test } from './helpers/fixtures.js'

// Shows only the items whose titles contain the search text.
const search = async (page: Page, text: string): Promise<void> => {
  await page.goto(`/?search=${encodeURIComponent(text)}`)
  await expect(page.getByRole('heading', { name: 'Items' })).toBeVisible()
}

const itemRow = (page: Page, title: string): Locator => page.getByRole('listitem').filter({ hasText: title })

test('lists items', async ({ page, prefix }) => {
  await createItem({ title: `${prefix} first`, type: 'read', labels: ['work'], length: 15, summary: 'Some **notes**' })
  await createItem({ title: `${prefix} second`, type: 'task' })

  await search(page, prefix)
  await expect(page.getByText('2 items')).toBeVisible()

  const row = itemRow(page, `${prefix} first`)
  await expect(row).toContainText('(read)')
  await expect(row).toContainText('labels: work')
  await expect(row).toContainText('15 min')
  await expect(row.locator('strong', { hasText: 'notes' })).toBeVisible()
  await expect(itemRow(page, `${prefix} second`)).toContainText('(do)')
})

test('filters items', async ({ page, prefix }) => {
  await createItem({ title: `${prefix} book`, type: 'read', labels: ['personal'] })
  await createItem({ title: `${prefix} chore`, type: 'task', labels: ['personal', 'busywork'] })
  await createItem({ title: `${prefix} report`, type: 'task', labels: ['work'] })

  await page.goto('/')
  await page.getByRole('button', { name: 'Show Filters' }).click()
  await page.getByRole('combobox', { name: 'Type' }).selectOption('task')
  await page.getByRole('listbox', { name: 'Label' }).selectOption(['personal'])
  await page.getByRole('textbox', { name: 'Search' }).fill(prefix)
  await page.getByRole('button', { name: 'Apply Filters' }).click()

  await expect(page).toHaveURL(/type=task/)
  await expect(page.getByText('1 item', { exact: true })).toBeVisible()
  await expect(itemRow(page, `${prefix} chore`)).toBeVisible()

  // Filters are kept after reloading.
  await page.reload()
  await expect(page.getByRole('combobox', { name: 'Type' })).toHaveValue('task')
  await expect(page.getByRole('textbox', { name: 'Search' })).toHaveValue(prefix)
  await expect(itemRow(page, `${prefix} chore`)).toBeVisible()
})

test('hides parent items with incomplete children unless asked', async ({ page, prefix }) => {
  const parent = await createItem({ title: `${prefix} parent`, type: 'task' })
  await createItem({ title: `${prefix} child`, type: 'task', parentId: parent.id })

  await search(page, prefix)
  await expect(itemRow(page, `${prefix} child`)).toContainText(`${prefix} parent`)
  await expect(page.getByText('1 item', { exact: true })).toBeVisible()

  // The filters are already shown, because the search is a filter.
  await page.getByRole('checkbox', { name: 'Include incomplete parent tasks' }).check()
  await page.getByRole('button', { name: 'Apply Filters' }).click()

  await expect(page.getByText('2 items')).toBeVisible()
  await expect(itemRow(page, `${prefix} parent`).filter({ hasText: '⤷' })).toContainText(`${prefix} child`)
})

test('marks an item as done and restores it', async ({ page, prefix }) => {
  const item = await createItem({ title: `${prefix} done`, type: 'task' })

  await search(page, prefix)
  const row = itemRow(page, item.title)
  await row.getByRole('checkbox', { name: 'Mark as done' }).check()
  await expect(row.getByRole('checkbox', { name: 'Restore item' })).toBeChecked()
  await expect.poll(async () => (await getItem(item.id)).deletedAt).not.toBeNull()

  // Done items are hidden, unless deleted items are included.
  await page.reload()
  await expect(page.getByText('No items found.')).toBeVisible()
  await page.goto(`/?search=${encodeURIComponent(prefix)}&includeDeleted=true`)
  await row.getByRole('checkbox', { name: 'Restore item' }).uncheck()
  await expect(row.getByRole('checkbox', { name: 'Mark as done' })).not.toBeChecked()
  await expect.poll(async () => (await getItem(item.id)).deletedAt).toBeNull()
})

test('edits an item', async ({ page, prefix }) => {
  const item = await createItem({ title: `${prefix} original`, type: 'task', labels: ['work'] })

  await search(page, prefix)
  const row = itemRow(page, item.title)
  await row.getByRole('button', { name: 'Edit' }).click()

  // The row no longer contains the title text once it's in edit mode.
  const form = page.getByRole('listitem').filter({ has: page.getByRole('button', { name: 'Save' }) })
  await form.getByRole('textbox', { name: 'Title' }).fill(`${prefix} edited`)
  await form.getByRole('combobox', { name: 'Type' }).selectOption('read')
  await form.getByRole('spinbutton', { name: 'Length' }).fill('45')
  await form.getByRole('textbox', { name: 'Summary' }).fill('Edited summary')
  await form.getByRole('textbox', { name: 'URI' }).fill('https://example.com/edited')
  await form.getByRole('listbox', { name: 'Labels' }).selectOption(['personal', 'important'])
  await form.getByRole('button', { name: 'Save' }).click()

  const editedRow = itemRow(page, `${prefix} edited`)
  await expect(editedRow).toContainText('(read)')
  await expect(editedRow).toContainText('45 min')
  await expect(editedRow).toContainText('Edited summary')
  await expect(editedRow).toContainText('labels: important, personal')
  await expect(editedRow.getByRole('link', { name: '[link]' })).toHaveAttribute('href', 'https://example.com/edited')

  const saved = await getItem(item.id)
  expect(saved).toMatchObject({
    title: `${prefix} edited`,
    type: 'read',
    length: 45,
    summary: 'Edited summary',
    uri: 'https://example.com/edited'
  })
  expect(saved.labels.sort()).toEqual(['important', 'personal'])
})

test('cancels editing an item', async ({ page, prefix }) => {
  const item = await createItem({ title: `${prefix} unchanged`, type: 'task' })

  await search(page, prefix)
  await itemRow(page, item.title).getByRole('button', { name: 'Edit' }).click()
  await page.getByRole('textbox', { name: 'Title' }).fill(`${prefix} changed`)
  await page.getByRole('button', { name: 'Cancel' }).click()

  await expect(itemRow(page, item.title)).toBeVisible()
  expect((await getItem(item.id)).title).toBe(item.title)
})
