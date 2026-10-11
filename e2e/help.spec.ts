import { expect, test, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'

// Real-browser checks for /help/. Screenshots go to screenshots/ (git-ignored).
const SHOTS = new URL('../screenshots/', import.meta.url).pathname

async function gotoWith(page: Page, path: string, init: { lang?: string; theme?: string }) {
  await page.addInitScript((s) => {
    try {
      if (s.lang) localStorage.setItem('flexdraw.lang', s.lang)
      if (s.theme) localStorage.setItem('flexdraw.theme', s.theme)
    } catch {
      /* storage blocked */
    }
  }, init)
  await page.goto(path)
  await expect(page.locator('h1')).toBeVisible()
}

test.beforeAll(() => mkdirSync(SHOTS, { recursive: true }))

test('help page loads with one h1 and five sections', async ({ page }) => {
  await gotoWith(page, '/help/', { lang: 'en' })
  await expect(page.locator('h1')).toHaveCount(1)
  await expect(page.locator('h1')).toHaveText('Help')
  await expect(page.locator('main section')).toHaveCount(5)
})

test('table of contents anchor scrolls to its section', async ({ page }) => {
  await gotoWith(page, '/help/', { lang: 'en' })
  await page.locator('nav a[href="#combine"]').click()
  await expect(page).toHaveURL(/#combine$/)
  await page.waitForFunction(() => {
    const top = document.getElementById('combine')!.getBoundingClientRect().top
    return Math.abs(top) < 40
  })
  const top = await page.locator('#combine').evaluate((el) => el.getBoundingClientRect().top)
  expect(Math.abs(top)).toBeLessThan(40)
  await expect(page.locator('#combine h2')).toBeInViewport()
})

test('h1 follows the saved language in both directions', async ({ page }) => {
  await gotoWith(page, '/help/', { lang: 'de' })
  await expect(page.locator('h1')).toHaveText('Hilfe')
  await gotoWith(page, '/help/', { lang: 'en' })
  await expect(page.locator('h1')).toHaveText('Help')
})

// Known blocker outside this work package: AppHeader.toggleLang passes this.$i18n
// (the legacy VueI18n instance) to setLang(), which reads i18n.global.locale and throws
// "Cannot set properties of undefined (setting 'locale')". Enable once AppHeader is fixed.
test('language toggle changes the h1', async ({ page }) => {
  await gotoWith(page, '/help/', { lang: 'en' })
  await expect(page.locator('h1')).toHaveText('Help')
  await page.getByTestId('lang-toggle').click()
  await expect(page.locator('h1')).toHaveText('Hilfe')
  await page.getByTestId('lang-toggle').click()
  await expect(page.locator('h1')).toHaveText('Help')
})

test('no horizontal overflow at 390px width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await gotoWith(page, '/help/', { lang: 'de' })
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(0)
})

test('no request to foreign hosts', async ({ page, baseURL }) => {
  const foreign: string[] = []
  page.on('request', (r) => {
    if (!r.url().startsWith(baseURL!) && !r.url().startsWith('data:')) foreign.push(r.url())
  })
  await gotoWith(page, '/help/', { lang: 'de' })
  await page.locator('#shortcuts').scrollIntoViewIfNeeded()
  expect(foreign).toEqual([])
})

test('screenshots: light, dark and German mobile', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 })
  await gotoWith(page, '/help/', { lang: 'en', theme: 'light' })
  await page.screenshot({ path: `${SHOTS}help-light.png`, fullPage: true })

  await gotoWith(page, '/help/', { lang: 'en', theme: 'dark' })
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.screenshot({ path: `${SHOTS}help-dark.png`, fullPage: true })

  await page.setViewportSize({ width: 390, height: 844 })
  await gotoWith(page, '/help/', { lang: 'de', theme: 'light' })
  await page.screenshot({ path: `${SHOTS}help-de-mobile.png`, fullPage: true })
})
