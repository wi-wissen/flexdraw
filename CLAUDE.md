# Flex Draw – architecture rules

A small browser SVG editor for children in computer science lessons. The point is to see
how SVG looks as text. Anything that distracts from that does not belong here.
Requirements: the "SVG-Editor für den Unterricht – Anforderungen" doc (German).

## Working agreements
- Chat with the user in German. Code, comments and commit messages in English.
- All visible UI text goes through vue-i18n (`de` + `en`), including tooltips, aria-labels,
  error messages and colour names. No hard-coded user-facing strings in components.
- Work directly on `main`. Commit only when `npm run typecheck` and `npm test` are green.
- Decide yourself; do not ask the user back. Report honestly what was not verified.

## Layers (dependencies point downwards only)
1. `src/core/` – **pure TypeScript, no DOM, no Vue, no browser globals.** Scene model,
   history, editor state machine, SVG read/write, palette, booleans. Runs in plain Node.
   `paperBridge.ts` is the only file that imports Paper.js; Paper objects never leave it and
   are never stored in the scene or in Vue `data()`.
2. `src/shared/` – i18n, theme, config, icons, header. Shared by all three pages.
3. `src/app/`, `src/help/`, `src/landing/` – one entry per page (Vite multi-page).
   Paper.js and highlight.js are loaded by `/app/` only.

## Rules
- **One source of truth: the scene** (`Scene` in `core/types.ts`). SVG text is generated from
  it (`sceneToSvg`); the reverse direction is `importSvg`. `Editor.applySource` emits origin
  `'source'`; the UI must not write such changes back into the source editor.
- **Integer times:** every time value (debounce, timestamps, durations) is an integer number
  of milliseconds. No floating-point seconds, no `Date` objects in the model.
- Scene geometry is rounded to at most 2 decimals; SVG contains hex colours only.
- Vue 3 **Options API** only (no `<script setup>`, no Composition API in components).
  Hold the `Editor` instance with `markRaw`.
- Never use `v-html` for SVG or user data. Imports are whitelist based (`svgRead.ts`).
- Style: neobrutalism (no border-radius, 2px border, hard 4px shadow). Tokens in
  `src/shared/styles.css`. Every button has visible text *and* an icon.
- i18n: one JSON file per namespace in `src/shared/locales/<lang>/<ns>.json`; de and en
  must have identical keys (tested).
- No network requests to third parties, no cookies; localStorage only for language, theme
  and the drawing.

## Dependencies
No new dependencies without asking the user first. Approved set (from the requirements):
vue, vue-i18n, paper, highlight.js, @fontsource-variable/space-grotesk,
@fontsource-variable/jetbrains-mono, vite, @vitejs/plugin-vue, tailwindcss,
@tailwindcss/vite, vitest, @vue/test-utils. Tooling added by the tech lead because the
requirements need it (CI lint, DOM for component tests, typecheck, real-browser E2E):
typescript, vue-tsc, eslint (+ typescript-eslint, eslint-plugin-vue), jsdom,
@playwright/test, @types/node.

## Commands
- `npm run dev` – dev server (use `-- --port N`)
- `npm run typecheck`, `npm test`, `npm run lint`, `npm run build`
- `npm run e2e` – real-browser tests (Playwright + system Chromium), needs a build or dev server

## Tests
- `tests/core/**` run in Node with `tests/setup/paper-shim.ts` (a stand-in `window` for Paper.js).
- `tests/ui/**` use jsdom + Vue Test Utils (`// @vitest-environment jsdom`).
- `e2e/**` run in a real browser.
