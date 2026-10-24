import type { Page } from '@playwright/test'
import { createItem, findItems } from './helpers/api.js'
import { apiBaseUrl } from './helpers/config.js'
import { expect, test } from './helpers/fixtures.js'

// The integration endpoints are mocked, so the tests don't depend on the API's integration settings.
const mockIntegrations = async (page: Page, enabled: boolean): Promise<void> => {
  await page.route(`${apiBaseUrl}/integrations`, async (route) => {
    await route.fulfill({ json: enabled ? [{ id: 'skylight', name: 'Skylight Calendar' }] : [] })
  })
}

// Records the item IDs sent to Skylight.
const mockSendToSkylight = async (page: Page, status = 201): Promise<string[]> => {
  const sentItemIds: string[] = []
  await page.route(`${apiBaseUrl}/integrations/skylight/chores`, async (route) => {
    sentItemIds.push(route.request().postDataJSON().itemId)
    await route.fulfill(status === 201
      ? { status, json: { choreId: '12345' } }
      : { status, json: { error: 'The Skylight API responded with status 401' } })
  })
  return sentItemIds
}

test.describe('with the Skylight integration disabled', () => {
  test.beforeEach(async ({ page }) => {
    await mockIntegrations(page, false)
  })

  test('does not offer to send new tasks to Skylight', async ({ page }) => {
    await page.goto('/add')
    await page.getByRole('combobox', { name: 'Type' }).selectOption('task')
    await expect(page.getByRole('listbox', { name: 'Labels' })).toBeVisible()
    await expect(page.getByRole('checkbox', { name: 'Also send to Skylight' })).toHaveCount(0)
  })

  test('does not offer to send existing tasks to Skylight', async ({ page, prefix }) => {
    const item = await createItem({ title: `${prefix} task`, type: 'task' })
    await page.goto(`/i/${item.id}`)
    await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Send to Skylight' })).toHaveCount(0)
  })
})

test.describe('with the Skylight integration enabled', () => {
  test.beforeEach(async ({ page }) => {
    await mockIntegrations(page, true)
  })

  test('shows the checkbox only for tasks, as the last field', async ({ page }) => {
    await page.goto('/add')
    const type = page.getByRole('combobox', { name: 'Type' })
    const checkbox = page.getByRole('checkbox', { name: 'Also send to Skylight' })

    await type.selectOption('read')
    await expect(page.getByRole('listbox', { name: 'Labels' })).toBeVisible()
    await expect(checkbox).toHaveCount(0)

    await type.selectOption('task')
    await expect(checkbox).not.toBeChecked()
    const lastField = page.locator('form label').last()
    await expect(lastField).toContainText('Also send to Skylight')
  })

  test('sends a new task to Skylight when checked', async ({ page, prefix }) => {
    const sentItemIds = await mockSendToSkylight(page)
    await page.goto('/add')
    await page.getByRole('textbox', { name: 'Title' }).fill(`${prefix} chore`)
    await page.getByRole('combobox', { name: 'Type' }).selectOption('task')
    await page.getByRole('checkbox', { name: 'Also send to Skylight' }).check()
    await page.getByRole('button', { name: 'Add Item' }).click()

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('status')).toContainText(`Sent "${prefix} chore" to Skylight.`)
    const [item] = await findItems(prefix)
    expect(sentItemIds).toEqual([item.id])
  })

  test('does not send a new task to Skylight when unchecked', async ({ page, prefix }) => {
    const sentItemIds = await mockSendToSkylight(page)
    await page.goto('/add')
    await page.getByRole('textbox', { name: 'Title' }).fill(`${prefix} not a chore`)
    await page.getByRole('combobox', { name: 'Type' }).selectOption('task')
    await page.getByRole('button', { name: 'Add Item' }).click()

    await expect(page).toHaveURL('/')
    await expect.poll(async () => await findItems(prefix)).toHaveLength(1)
    expect(sentItemIds).toEqual([])
  })

  test('still adds the task if sending to Skylight fails', async ({ page, prefix }) => {
    await mockSendToSkylight(page, 502)
    await page.goto('/add')
    await page.getByRole('textbox', { name: 'Title' }).fill(`${prefix} chore`)
    await page.getByRole('combobox', { name: 'Type' }).selectOption('task')
    await page.getByRole('checkbox', { name: 'Also send to Skylight' }).check()
    await page.getByRole('button', { name: 'Add Item' }).click()

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('alert')).toContainText(`Failed to send "${prefix} chore" to Skylight`)
    expect(await findItems(prefix)).toHaveLength(1)
  })

  test('sends an existing task to Skylight from its row', async ({ page, prefix }) => {
    const sentItemIds = await mockSendToSkylight(page)
    const item = await createItem({ title: `${prefix} task`, type: 'task' })
    await page.goto(`/i/${item.id}`)
    await page.getByRole('listitem').getByRole('button', { name: 'Send to Skylight' }).click()

    await expect(page.getByRole('status')).toContainText(`Sent "${prefix} task" to Skylight.`)
    expect(sentItemIds).toEqual([item.id])
  })

  test('does not offer to send from the edit form', async ({ page, prefix }) => {
    const item = await createItem({ title: `${prefix} task`, type: 'task' })
    await page.goto(`/i/${item.id}`)
    await page.getByRole('button', { name: 'Edit' }).click()
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Send to Skylight' })).toHaveCount(0)
  })

  test('shows an error if sending an existing task fails', async ({ page, prefix }) => {
    await mockSendToSkylight(page, 502)
    const item = await createItem({ title: `${prefix} task`, type: 'task' })
    await page.goto(`/i/${item.id}`)
    await page.getByRole('button', { name: 'Send to Skylight' }).click()

    await expect(page.getByRole('alert')).toContainText(`Failed to send "${prefix} task" to Skylight`)
    await expect(page.getByRole('button', { name: 'Send to Skylight' })).toBeEnabled()
  })

  test('does not offer to send items that are not tasks', async ({ page, prefix }) => {
    const item = await createItem({ title: `${prefix} book`, type: 'read' })
    await page.goto(`/i/${item.id}`)
    await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Send to Skylight' })).toHaveCount(0)
  })
})
