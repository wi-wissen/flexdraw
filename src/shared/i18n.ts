import { createI18n } from 'vue-i18n'
import { STORAGE } from './config'

export type Lang = 'de' | 'en'
export const LANGS: Lang[] = ['de', 'en']

// Every file in locales/<lang>/ is one namespace (file name = top-level key).
const files = import.meta.glob('./locales/*/*.json', { eager: true, import: 'default' }) as Record<string, object>

export function buildMessages(): Record<Lang, Record<string, unknown>> {
  const out: Record<Lang, Record<string, unknown>> = { de: {}, en: {} }
  for (const [path, json] of Object.entries(files)) {
    const m = /\.\/locales\/(de|en)\/([^/]+)\.json$/.exec(path)
    if (m) out[m[1] as Lang][m[2]!] = json
  }
  return out
}

export function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE.lang)
    if (saved === 'de' || saved === 'en') return saved
  } catch {
    /* ignore */
  }
  return navigator.language?.toLowerCase().startsWith('de') ? 'de' : 'en'
}

export function makeI18n() {
  const lang = detectLang()
  document.documentElement.lang = lang
  return createI18n({ legacy: true, locale: lang, fallbackLocale: 'en', messages: buildMessages() as any })
}

/** Works with the legacy i18n instance (`this.$i18n`) as well as the plugin object. */
export function setLang(target: { locale: string } | { global: { locale: string } }, lang: Lang): void {
  const g = 'global' in target ? target.global : target
  g.locale = lang
  document.documentElement.lang = lang
  try {
    localStorage.setItem(STORAGE.lang, lang)
  } catch {
    /* ignore */
  }
}
