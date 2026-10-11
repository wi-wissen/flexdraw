import { STORAGE } from './config'

export type Theme = 'light' | 'dark'

export function readTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE.theme)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* storage may be blocked */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(t: Theme): void {
  document.documentElement.classList.toggle('dark', t === 'dark')
  document.documentElement.style.colorScheme = t
}

export function saveTheme(t: Theme): void {
  try {
    localStorage.setItem(STORAGE.theme, t)
  } catch {
    /* ignore */
  }
  applyTheme(t)
}
