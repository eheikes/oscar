import { logIn } from './helpers/auth.js'
import { testUser } from './helpers/config.js'
import { expect, test } from './helpers/fixtures.js'

test.describe('when logged out', () => {
  test.use({ authenticated: false })

  test('redirects to the login page', async ({ page }) => {
    await page.goto('/choose')
    await expect(page).toHaveURL('/login')
    await expect(page.getByRole('heading', { name: 'Welcome to OSCAR' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Login with Auth0' })).toBeVisible()
  })

  test('returns to the original page after logging in', async ({ page }) => {
    await page.goto('/retro?days=30')
    await expect(page).toHaveURL('/login')

    // Auth0 sends the user back to the app's root after logging in.
    await logIn(page)
    await page.goto('/')
    await expect(page).toHaveURL('/retro?days=30')
    await expect(page.getByRole('spinbutton', { name: 'Past days' })).toHaveValue('30')
  })
})

test.describe('when logged in', () => {
  test('shows the navigation and user', async ({ page }) => {
    await page.goto('/')
    const nav = page.getByRole('navigation')
    for (const link of ['Home', 'Choose', 'Retrospective', 'Add Item']) {
      await expect(nav.getByRole('link', { name: link })).toBeVisible()
    }
    await expect(nav.getByText(testUser.email)).toBeVisible()
  })

  test('navigates between pages', async ({ page }) => {
    await page.goto('/')
    const nav = page.getByRole('navigation')

    await nav.getByRole('link', { name: 'Choose' }).click()
    await expect(page.getByRole('heading', { name: 'Choose Next Item' })).toBeVisible()

    await nav.getByRole('link', { name: 'Retrospective' }).click()
    await expect(page.getByRole('heading', { name: 'Retrospective' })).toBeVisible()

    await nav.getByRole('link', { name: 'Home' }).click()
    await expect(page.getByRole('heading', { name: 'Items' })).toBeVisible()
  })

  test('logs out', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Logout' }).click()
    await expect(page).toHaveURL('/login')
    await expect(page.getByRole('button', { name: 'Login with Auth0' })).toBeVisible()

    // Stays logged out.
    await page.goto('/')
    await expect(page).toHaveURL('/login')
  })
})
