import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    // Use the browser build of Paper.js in tests too; see tests/setup/paper-shim.ts.
    alias: { paper: resolve(import.meta.dirname, 'node_modules/paper/dist/paper-core.js') },
  },
  test: {
    environment: 'node',
    setupFiles: ['tests/setup/paper-shim.ts'],
    include: ['tests/**/*.test.ts'],
  },
})
