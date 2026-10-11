# Flex Draw

Flex Draw is a small browser SVG editor for children in computer science lessons. You draw
shapes, change colours, and see at once what the picture looks like as SVG source code.
The point is to see how SVG looks as text, so the interface stays deliberately small.

## Developing

```sh
npm ci
npm run dev            # dev server; use `npm run dev -- --port 5200` for a fixed port
npm run lint           # ESLint (TypeScript, Vue, Options-API-only rule)
npm run typecheck      # vue-tsc
```

## Testing

```sh
npm test               # unit and component tests (Vitest)
npm run dev -- --port 5200 &
E2E_BASE_URL=http://localhost:5200 npm run e2e   # real-browser tests (Playwright)
```

The E2E tests use a system Chromium; they need a running server (dev or build output).

## Building

```sh
npm run build          # type check, then static build into dist/
```

## Hosting

`dist/` is a plain static folder with relative asset paths, so it works from any sub folder.
Copy it to a web server as is, for example to `/svg/app/`. The pages are `index.html`
(start page), `app/` (editor) and `help/`.

## Privacy

Flex Draw does not track anyone. It makes no third-party requests, sets no cookies, and
uses no analytics. The only thing it stores is in the browser's localStorage: the chosen
language, the chosen theme, and the current drawing.

## Project layout

- `index.html`, `app/`, `help/`: the three pages (Vite multi-page build)
- `src/core/`: pure TypeScript scene model, SVG read and write, Paper.js bridge
- `src/shared/`: i18n, theme, header, icons, styles (shared by all pages)
- `src/landing/`, `src/app/`, `src/help/`: one Vue entry per page
- `src/shared/locales/`: UI text in `de` and `en` (both must have the same keys)
- `tests/core/`: Node tests for the core; `tests/ui/`: jsdom component tests (planned, none yet)
- `tests/setup/`: test helpers (Paper.js stand-in for Node)
- `e2e/`: Playwright tests against a running server
- `CLAUDE.md`: architecture rules and working agreements (read this before changing code)

## License

No license has been chosen yet. The source code is public, but without a license no rights to reuse it are granted.
