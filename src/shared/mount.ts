import { createApp, type Component } from 'vue'
import './styles.css'
import { makeI18n } from './i18n'

/** Shared bootstrap: every page gets i18n, tokens and fonts the same way. */
export function mountPage(root: Component, selector = '#root') {
  const i18n = makeI18n()
  const app = createApp(root)
  app.use(i18n)
  app.mount(selector)
  return { app, i18n }
}
