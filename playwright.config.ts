import { defineConfig } from '@playwright/test'

// Real-browser tests against a running server. Start one first, for example
//   npm run dev -- --port 5200      then      E2E_BASE_URL=http://localhost:5200 npm run e2e
// Each work package uses its own port (see CLAUDE.md).
export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5200',
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
      args: ['--no-sandbox'],
    },
    screenshot: 'off',
  },
})
