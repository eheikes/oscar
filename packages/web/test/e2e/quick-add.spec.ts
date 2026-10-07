import { findItems } from './helpers/api.js'
import { expect, test } from './helpers/fixtures.js'

test('adds an item from the quick-add overlay', async ({ page, prefix }) => {
  const title = `${prefix} quick item`
  await page.goto('/choose')
  await page.getByRole('navigation').getByRole('link', { name: 'Add Item' }).click()

  // Stays on the same page.
  const dialog = page.getByRole('dialog', { name: 'Add Item' })
  await expect(dialog).toBeVisible()
  await expect(page).toHaveURL('/choose')

  await expect(dialog.getByRole('textbox', { name: 'Title' })).toBeFocused()
  await dialog.getByRole('textbox', { name: 'Title' }).fill(title)
  await dialog.getByRole('combobox', { name: 'Type' }).selectOption('watch')
  await dialog.getByRole('button', { name: 'Add Item' }).click()
  await expect(dialog).toBeHidden()

  const toast = page.getByRole('status').filter({ hasText: 'Item added.' })
  await expect(toast).toBeVisible()
  const [item] = await findItems(prefix)
  expect(item).toMatchObject({ title, type: 'watch' })

  // The toast links to the new item.
  await toast.getByRole('link', { name: 'View the new item.' }).click()
  await expect(page).toHaveURL(`/i/${item.id}`)
  await expect(page.getByRole('listitem').filter({ hasText: title })).toBeVisible()
  await expect(toast).toBeHidden()
})

test('closes the quick-add overlay', async ({ page }) => {
  await page.goto('/')
  const addLink = page.getByRole('navigation').getByRole('link', { name: 'Add Item' })
  const dialog = page.getByRole('dialog', { name: 'Add Item' })

  await addLink.click()
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toBeHidden()

  await addLink.click()
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('switches to the full add form', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('navigation').getByRole('link', { name: 'Add Item' }).click()
  await page.getByRole('dialog').getByRole('link', { name: 'Use full Add Item form' }).click()

  await expect(page).toHaveURL('/add')
  await expect(page.getByRole('heading', { name: 'Add Item', level: 1 })).toBeVisible()
  await expect(page.getByRole('dialog')).toBeHidden()
})
