import { defineConfig, devices } from '@playwright/test'

// The dev server uses HTTPS (with a self-signed certificate).
const baseURL = process.env.WEB_BASE_URL ?? 'https://127.0.0.1:4173'

export default defineConfig({
  testDir: './test/e2e',
  testMatch: /.*\.spec\.ts/,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  globalSetup: './test/e2e/playwright.setup.ts',
  use: {
    baseURL,
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry'
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',
    url: baseURL,
    ignoreHTTPSErrors: true,
    reuseExistingServer: !process.env.CI,
    cwd: '.'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
})
