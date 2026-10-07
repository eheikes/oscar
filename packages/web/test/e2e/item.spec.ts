import { createItem, getItem } from './helpers/api.js'
import { expect, test } from './helpers/fixtures.js'

test('shows a single item', async ({ page, prefix }) => {
  const item = await createItem({ title: `${prefix} single`, type: 'listen', labels: ['personal'], summary: 'Item summary' })

  await page.goto(`/i/${item.id}`)
  const row = page.getByRole('listitem')
  await expect(row).toHaveCount(1)
  await expect(row).toContainText(item.title)
  await expect(row).toContainText('(listen to)')
  await expect(row).toContainText('labels: personal')
  await expect(row).toContainText('Item summary')
})

test('edits and completes a single item', async ({ page, prefix }) => {
  const item = await createItem({ title: `${prefix} single`, type: 'task' })

  await page.goto(`/i/${item.id}`)
  await page.getByRole('button', { name: 'Edit' }).click()
  await page.getByRole('textbox', { name: 'Title' }).fill(`${prefix} renamed`)
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('listitem')).toContainText(`${prefix} renamed`)

  await page.getByRole('checkbox', { name: 'Mark as done' }).check()
  await expect(page.getByRole('checkbox', { name: 'Restore item' })).toBeChecked()

  await expect.poll(async () => await getItem(item.id)).toMatchObject({
    title: `${prefix} renamed`,
    deletedAt: expect.any(String)
  })
})
