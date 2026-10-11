export interface Library {
  /** Key under credits.libs.* for the one-line description. */
  key: string
  name: string
  url: string
  license: string
  /** Runtime libraries ship to the browser; "dev" ones are only used to build and test. */
  group: 'runtime' | 'dev'
}

export const LIBRARIES: Library[] = [
  { key: 'vue', name: 'Vue', url: 'https://vuejs.org/', license: 'MIT', group: 'runtime' },
  { key: 'paper', name: 'Paper.js', url: 'https://paperjs.org/', license: 'MIT', group: 'runtime' },
  { key: 'i18n', name: 'Vue I18n', url: 'https://vue-i18n.intlify.dev/', license: 'MIT', group: 'runtime' },
  { key: 'hljs', name: 'highlight.js', url: 'https://highlightjs.org/', license: 'BSD-3-Clause', group: 'runtime' },
  { key: 'tailwind', name: 'Tailwind CSS', url: 'https://tailwindcss.com/', license: 'MIT', group: 'runtime' },
  { key: 'grotesk', name: 'Space Grotesk (Fontsource)', url: 'https://fontsource.org/fonts/space-grotesk', license: 'OFL-1.1', group: 'runtime' },
  { key: 'jetbrains', name: 'JetBrains Mono (Fontsource)', url: 'https://fontsource.org/fonts/jetbrains-mono', license: 'OFL-1.1', group: 'runtime' },
  { key: 'vite', name: 'Vite', url: 'https://vite.dev/', license: 'MIT', group: 'dev' },
  { key: 'vitest', name: 'Vitest', url: 'https://vitest.dev/', license: 'MIT', group: 'dev' },
  { key: 'vtu', name: 'Vue Test Utils', url: 'https://test-utils.vuejs.org/', license: 'MIT', group: 'dev' },
  { key: 'playwright', name: 'Playwright', url: 'https://playwright.dev/', license: 'Apache-2.0', group: 'dev' },
  { key: 'typescript', name: 'TypeScript', url: 'https://www.typescriptlang.org/', license: 'Apache-2.0', group: 'dev' },
  { key: 'eslint', name: 'ESLint', url: 'https://eslint.org/', license: 'MIT', group: 'dev' },
]
