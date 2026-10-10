import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['test/**/*.spec.ts'],
    globalSetup: ['test/e2e/helpers/global-setup.ts'],
    fileParallelism: false,
    sequence: {
      concurrent: false
    }
  }
})
