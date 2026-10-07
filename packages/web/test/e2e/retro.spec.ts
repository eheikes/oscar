import type { Locator } from '@playwright/test'
import { createItem, updateItem } from './helpers/api.js'
import { expect, test } from './helpers/fixtures.js'

const DAY_MS = 24 * 60 * 60 * 1000

const createDoneItem = async (data: Parameters<typeof createItem>[0], daysAgo: number): Promise<void> => {
  const item = await createItem(data)
  // A minute earlier, in case the API's clock is a little behind.
  await updateItem(item.id, { deletedAt: new Date(Date.now() - daysAgo * DAY_MS - 60_000).toISOString() })
}

test('shows recently completed items by category', async ({ page, prefix }) => {
  await createDoneItem({ title: `${prefix} work task`, type: 'task', labels: ['work'] }, 1)
  await createDoneItem({ title: `${prefix} book`, type: 'read', labels: ['personal', 'work'] }, 2)
  await createDoneItem({ title: `${prefix} unlabeled`, type: 'task' }, 3)
  await createDoneItem({ title: `${prefix} old task`, type: 'task', labels: ['work'] }, 20)
  await createItem({ title: `${prefix} not done`, type: 'task', labels: ['work'] })

  await page.goto('/retro')
  await expect(page.getByRole('spinbutton', { name: 'Past days' })).toHaveValue('7')

  const group = (name: string): Locator => page.locator('section').filter({
    has: page.getByRole('heading', { name: new RegExp(`^${name} \\(\\d+\\)$`) })
  })
  await expect(group('work').getByText(`${prefix} work task`)).toBeVisible()
  await expect(group('work').getByText(`${prefix} book`)).toBeVisible()
  await expect(group('personal').getByText(`${prefix} book`)).toBeVisible()
  await expect(group('Uncategorized').getByText(`${prefix} unlabeled`)).toBeVisible()
  await expect(page.getByText(`${prefix} old task`)).toBeHidden()
  await expect(page.getByText(`${prefix} not done`)).toBeHidden()

  // Look further back, at one category.
  await page.getByRole('spinbutton', { name: 'Past days' }).fill('30')
  await page.getByRole('combobox', { name: 'Type' }).selectOption('task')
  await page.getByRole('listbox', { name: 'Categories' }).selectOption(['work'])
  await page.getByRole('button', { name: 'Apply' }).click()

  await expect(page).toHaveURL(/days=30/)
  await expect(group('work').getByText(`${prefix} work task`)).toBeVisible()
  await expect(group('work').getByText(`${prefix} old task`)).toBeVisible()
  await expect(page.getByText(`${prefix} book`)).toBeHidden()
  await expect(page.getByText(`${prefix} unlabeled`)).toBeHidden()
})
