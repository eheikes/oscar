import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.WEB_BASE_URL ?? 'http://127.0.0.1:4173'

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
    trace: 'on-first-retry'
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    url: baseURL,
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
