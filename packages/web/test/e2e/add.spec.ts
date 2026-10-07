import { findItems } from './helpers/api.js'
import { expect, test } from './helpers/fixtures.js'

test('adds an item with the full form', async ({ page, prefix }) => {
  const title = `${prefix} new item`
  await page.goto('/add')
  await expect(page.getByRole('heading', { name: 'Add Item' })).toBeVisible()

  const addButton = page.getByRole('button', { name: 'Add Item' })
  await expect(addButton).toBeDisabled()

  await page.getByRole('textbox', { name: 'Title' }).fill(title)
  await page.getByRole('combobox', { name: 'Type' }).selectOption('task')
  await page.getByLabel('Due date').fill('2030-01-15T09:30')
  await page.getByRole('spinbutton', { name: 'Length' }).fill('20')
  await page.getByRole('textbox', { name: 'Summary' }).fill('A summary')
  await page.getByRole('textbox', { name: 'URI' }).fill('https://example.com/new')
  await page.getByRole('listbox', { name: 'Labels' }).selectOption(['work', 'urgent'])
  await addButton.click()

  // Goes back to the home page.
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('heading', { name: 'Items' })).toBeVisible()

  const [item] = await findItems(prefix)
  expect(item).toMatchObject({
    title,
    type: 'task',
    length: 20,
    summary: 'A summary',
    uri: 'https://example.com/new'
  })
  expect(new Date(item.due ?? '')).toEqual(new Date(2030, 0, 15, 9, 30))
  expect(item.labels.sort()).toEqual(['urgent', 'work'])
})

test('adds a child item', async ({ page, prefix }) => {
  await page.goto('/add')
  await page.getByRole('textbox', { name: 'Title' }).fill(`${prefix} parent`)
  await page.getByRole('combobox', { name: 'Type' }).selectOption('task')
  await page.getByRole('button', { name: 'Add Item' }).click()
  await expect(page).toHaveURL('/')
  const [parent] = await findItems(prefix)

  await page.goto('/add')
  await page.getByRole('textbox', { name: 'Title' }).fill(`${prefix} child`)
  await page.getByRole('combobox', { name: 'Type' }).selectOption('task')
  await page.getByRole('textbox', { name: 'Parent ID' }).fill(parent.id)
  await page.getByRole('button', { name: 'Add Item' }).click()
  await expect(page).toHaveURL('/')

  await page.goto(`/?search=${encodeURIComponent(`${prefix} child`)}`)
  await expect(page.getByRole('listitem').filter({ hasText: `${prefix} child` })).toContainText(`${prefix} parent`)
})

test('cancels adding an item', async ({ page, prefix }) => {
  await page.goto('/add')
  await page.getByRole('textbox', { name: 'Title' }).fill(`${prefix} cancelled`)
  await page.getByRole('link', { name: 'Cancel' }).click()

  await expect(page).toHaveURL('/')
  expect(await findItems(prefix)).toHaveLength(0)
})
