import { expect, test, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'

// Real-browser checks for the landing page "/". Screenshots go to screenshots/ (git-ignored).
const SHOTS = new URL('../screenshots/', import.meta.url).pathname
const GITHUB = 'https://github.com/wi-wissen/flexdraw'

async function gotoWith(page: Page, init: { lang?: string; theme?: string }) {
  await page.addInitScript((s) => {
    try {
      if (s.lang) localStorage.setItem('flexdraw.lang', s.lang)
      if (s.theme) localStorage.setItem('flexdraw.theme', s.theme)
    } catch {
      /* storage blocked */
    }
  }, init)
  await page.goto('/')
  await expect(page.locator('h1')).toBeVisible()
}

/** Scroll through the page so every scroll-reveal section has stamped in. */
/** Wait until the demo has drawn every shape, then pause it for a stable screenshot. */
async function demoDone(page: Page) {
  await expect(page.locator('[data-testid="demo-shape"]')).toHaveCount(7, { timeout: 25_000 })
  await page.getByTestId('demo-toggle').click()
  await page.waitForTimeout(700)
}

async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    const step = Math.max(200, Math.floor(window.innerHeight / 2))
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 60))
    }
    window.scrollTo(0, 0)
  })
  await page.waitForTimeout(900)
}

const shownLines = (page: Page) => page.locator('[data-testid="demo-line"].is-done').count()

const overflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

test.beforeAll(() => mkdirSync(SHOTS, { recursive: true }))

test('loads without console errors and without third-party requests', async ({ page, baseURL }) => {
  const errors: string[] = []
  const foreign: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('request', (r) => {
    if (!r.url().startsWith(baseURL!) && !r.url().startsWith('data:')) foreign.push(r.url())
  })
  await gotoWith(page, { lang: 'en' })
  await scrollThrough(page)
  expect(foreign).toEqual([])
  expect(errors).toEqual([])
  await expect(page.locator('h1')).toHaveCount(1)
})

test('CTAs point to the app and to GitHub (hero, final band and footer)', async ({ page }) => {
  await gotoWith(page, { lang: 'de' })
  const start = page.getByTestId('cta-start')
  await expect(start).toHaveAttribute('href', './app/')
  await expect(start).toContainText('Zeichnen starten')
  await expect(page.getByTestId('cta-start-2')).toHaveAttribute('href', './app/')
  for (const id of ['cta-github', 'cta-github-2', 'footer-github']) {
    const a = page.getByTestId(id)
    await expect(a).toHaveAttribute('href', GITHUB)
    await expect(a).toHaveAttribute('rel', 'noopener noreferrer')
    await expect(a).toContainText('Auf GitHub ansehen')
  }
  await expect(page.getByTestId('footer-credits')).toHaveAttribute('href', './credits/')
  // Resolved URL of the start link really is /app/.
  expect(await start.evaluate((a) => (a as HTMLAnchorElement).pathname)).toBe('/app/')
})

for (const width of [360, 1440, 1920]) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await gotoWith(page, { lang: 'de' })
    await scrollThrough(page)
    expect(await overflow(page)).toBeLessThanOrEqual(0)
  })
}

test('demo advances over time and the pause button stops it', async ({ page }) => {
  await gotoWith(page, { lang: 'en' })
  await page.locator('#live').scrollIntoViewIfNeeded()
  const first = await shownLines(page)
  await expect.poll(() => shownLines(page), { timeout: 8000 }).toBeGreaterThan(first + 1)
  await expect.poll(() => page.locator('[data-testid="demo-shape"]').count(), { timeout: 8000 }).toBeGreaterThan(0)

  const toggle = page.getByTestId('demo-toggle')
  await expect(toggle).toContainText('Pause animation')
  await toggle.click()
  await expect(toggle).toContainText('Play animation')
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  const frozen = await page.locator('.lp-demo-code').innerText()
  await page.waitForTimeout(1200)
  expect(await page.locator('.lp-demo-code').innerText()).toBe(frozen)

  await toggle.click()
  await expect.poll(() => page.locator('.lp-demo-code').innerText(), { timeout: 4000 }).not.toBe(frozen)
})

test('reduced motion shows the finished drawing and stays still', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await gotoWith(page, { lang: 'en' })
  const lines = page.locator('[data-testid="demo-line"]')
  const total = await lines.count()
  expect(total).toBe(9)
  expect(await shownLines(page)).toBe(total)
  await expect(page.locator('[data-testid="demo-shape"]')).toHaveCount(7)
  await expect(page.getByTestId('demo-toggle')).toContainText('Play animation')
  const before = await page.locator('.lp-demo-code').innerText()
  await page.waitForTimeout(1200)
  expect(await page.locator('.lp-demo-code').innerText()).toBe(before)
  // No running CSS animations anywhere on the page.
  const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)
  expect(running).toBe(0)
  // Sections are visible without scrolling them into view.
  await expect(page.locator('#privacy h2')).toHaveCSS('opacity', '1')
})

test('language toggle switches the page text', async ({ page }) => {
  await gotoWith(page, { lang: 'en' })
  await expect(page.getByTestId('cta-start')).toContainText('Start drawing')
  await expect(page.locator('#combine-title')).toHaveText('Combine shapes')
  await page.getByTestId('lang-toggle').click()
  await expect(page.getByTestId('cta-start')).toContainText('Zeichnen starten')
  await expect(page.locator('#combine-title')).toHaveText('Formen kombinieren')
  await expect(page.locator('html')).toHaveAttribute('lang', 'de')
})

test('dark mode toggle switches the theme', async ({ page }) => {
  await gotoWith(page, { lang: 'en', theme: 'light' })
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  const lightBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  await page.getByTestId('theme-toggle').click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  const darkBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  expect(darkBg).not.toBe(lightBg)
})

test('keyboard: skip link and CTA get a visible focus outline', async ({ page }) => {
  await gotoWith(page, { lang: 'en' })
  await page.keyboard.press('Tab')
  await expect(page.locator('.lp-skip')).toBeFocused()
  await page.getByTestId('cta-start').focus()
  const outline = await page.getByTestId('cta-start').evaluate((el) => getComputedStyle(el).outlineStyle)
  expect(outline).toBe('solid')
})

test('screenshots: 1440 light, 1440 dark, 390 light', async ({ page }) => {
  test.setTimeout(120_000)
  await page.setViewportSize({ width: 1440, height: 900 })
  await gotoWith(page, { lang: 'de', theme: 'light' })
  await scrollThrough(page)
  await demoDone(page)
  await page.screenshot({ path: `${SHOTS}landing-1440-light.png`, fullPage: true })

  await gotoWith(page, { lang: 'en', theme: 'dark' })
  await expect(page.locator('html')).toHaveClass(/dark/)
  await scrollThrough(page)
  await demoDone(page)
  await page.screenshot({ path: `${SHOTS}landing-1440-dark.png`, fullPage: true })

  await page.setViewportSize({ width: 390, height: 844 })
  await gotoWith(page, { lang: 'de', theme: 'light' })
  await scrollThrough(page)
  await demoDone(page)
  await page.screenshot({ path: `${SHOTS}landing-390-light.png`, fullPage: true })
})
