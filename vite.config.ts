import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'

// All three pages are build inputs; base is relative so dist/ runs from any sub folder.
export default defineConfig({
  base: './',
  plugins: [vue(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        landing: resolve(import.meta.dirname, 'index.html'),
        app: resolve(import.meta.dirname, 'app/index.html'),
        help: resolve(import.meta.dirname, 'help/index.html'),
        credits: resolve(import.meta.dirname, 'credits/index.html'),
      },
    },
  },
})
