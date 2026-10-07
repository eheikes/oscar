import { createItem } from './helpers/api.js'
import { expect, test } from './helpers/fixtures.js'

test('chooses the next items of a type', async ({ page, prefix }) => {
  // A type that the API's test data doesn't use, so only these items are candidates.
  await createItem({ title: `${prefix} first`, type: 'watch-passive', labels: ['personal'] })
  await createItem({ title: `${prefix} second`, type: 'watch-passive', labels: ['personal'] })
  await createItem({ title: `${prefix} other`, type: 'watch-passive', labels: ['work'] })

  await page.goto('/choose')
  await expect(page.getByRole('heading', { name: 'Results' })).toBeHidden()

  await page.getByRole('combobox', { name: 'Type' }).selectOption('watch-passive')
  await page.getByRole('spinbutton', { name: 'Count' }).fill('5')
  await page.getByRole('listbox', { name: 'Label' }).selectOption(['personal'])
  await page.getByRole('button', { name: 'Get Items' }).click()

  await expect(page).toHaveURL(/type=watch-passive/)
  await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible()
  const results = page.getByRole('listitem')
  await expect(results).toHaveCount(2)
  await expect(results.filter({ hasText: `${prefix} first` })).toBeVisible()
  await expect(results.filter({ hasText: `${prefix} second` })).toBeVisible()

  // The choices are kept after reloading.
  await page.reload()
  await expect(page.getByRole('combobox', { name: 'Type' })).toHaveValue('watch-passive')
  await expect(page.getByRole('spinbutton', { name: 'Count' })).toHaveValue('5')
  await expect(results).toHaveCount(2)
})

test('marks a chosen item as done', async ({ page, prefix }) => {
  await createItem({ title: `${prefix} chosen`, type: 'watch-passive' })

  await page.goto('/choose?type=watch-passive&count=1')
  const row = page.getByRole('listitem').filter({ hasText: `${prefix} chosen` })
  await row.getByRole('checkbox', { name: 'Mark as done' }).check()
  await expect(row.getByRole('checkbox', { name: 'Restore item' })).toBeChecked()

  // It's no longer chosen.
  await page.reload()
  await expect(page.getByRole('combobox', { name: 'Type' })).toHaveValue('watch-passive')
  await expect(page.getByText(`${prefix} chosen`)).toBeHidden()
  await expect(page.getByText('No items found for the selected criteria.')).toBeVisible()
})
