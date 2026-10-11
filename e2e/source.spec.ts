import { expect, test, type Page } from '@playwright/test'

const URL = '/harness/source/'
const input = (page: Page) => page.getByTestId('source-input')
const layer = (page: Page) => page.getByTestId('source-highlight')
const log = (page: Page) => page.locator('#log')

async function setDark(page: Page, dark: boolean) {
  await page.evaluate((d) => document.documentElement.classList.toggle('dark', d), dark)
}

test.beforeEach(async ({ page }) => {
  // Pin the UI language so the German texts are checked whatever the browser locale is.
  await page.addInitScript(() => localStorage.setItem('flexdraw.lang', 'de'))
  await page.goto(URL)
  await expect(input(page)).toBeVisible()
})

test('typing emits edit once after the debounce', async ({ page }) => {
  await input(page).click()
  await page.keyboard.press('End')
  await page.keyboard.type('X')
  await expect(log(page)).toContainText('edit:', { timeout: 2000 })
  await expect(log(page)).toContainText('(' + ((await input(page).inputValue()).length) + ')')
  const lines = (await log(page).innerText()).split('\n').filter((l) => l.startsWith('edit:'))
  expect(lines).toHaveLength(1)
})

test('Tab inserts two spaces and keeps focus in the editor', async ({ page }) => {
  await input(page).click()
  await page.keyboard.press('Control+Home')
  const before = await input(page).inputValue()
  await page.keyboard.press('Tab')
  const after = await input(page).inputValue()
  expect(after).toBe('  ' + before)
  await expect(input(page)).toBeFocused()
})

test('Escape releases focus', async ({ page }) => {
  await input(page).click()
  await expect(input(page)).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(input(page)).not.toBeFocused()
})

test('colour layer and textarea scroll together on a long text', async ({ page }) => {
  await page.getByRole('button', { name: 'Langer Text' }).click()
  await input(page).evaluate((el: HTMLTextAreaElement) => {
    el.scrollTop = 400
    el.scrollLeft = 120
    el.dispatchEvent(new Event('scroll'))
  })
  const [ta, pre] = await Promise.all([
    input(page).evaluate((el: HTMLElement) => ({ top: el.scrollTop, left: el.scrollLeft })),
    layer(page).evaluate((el: HTMLElement) => ({ top: el.scrollTop, left: el.scrollLeft })),
  ])
  expect(ta.top).toBeGreaterThan(0)
  expect(pre.top).toBe(ta.top)
  expect(pre.left).toBe(ta.left)
})

test('overlay layers share geometry and typography', async ({ page }) => {
  const metrics = (loc: ReturnType<typeof input>) =>
    loc.evaluate((el) => {
      const cs = getComputedStyle(el)
      const r = el.getBoundingClientRect()
      return {
        x: r.x, y: r.y, w: r.width, h: r.height,
        font: cs.fontFamily, size: cs.fontSize, lh: cs.lineHeight, pad: cs.padding,
        tab: cs.tabSize, ws: cs.whiteSpace, ls: cs.letterSpacing,
      }
    })
  const t = await metrics(input(page))
  const c = await metrics(layer(page))
  expect(c.x).toBeCloseTo(t.x, 0)
  expect(c.y).toBeCloseTo(t.y, 0)
  expect(c.w).toBeCloseTo(t.w, 0)
  expect(c.h).toBeCloseTo(t.h, 0)
  expect(c.font).toBe(t.font)
  expect(c.size).toBe(t.size)
  expect(c.lh).toBe(t.lh)
  expect(c.pad).toBe(t.pad)
  expect(c.tab).toBe(t.tab)
  expect(c.ws).toBe('pre')
  expect(t.ws).toBe('pre')
  expect(c.ls).toBe(t.ls)
  expect(t.font).toContain('JetBrains Mono')
})

test('a text ending in a newline keeps the last line in the colour layer', async ({ page }) => {
  await input(page).fill('<svg>\n')
  const h = await layer(page).evaluate((el) => el.querySelector('code')!.textContent)
  expect(h).toBe('<svg>\n ')
})

test('an external change updates the textarea and the colour layer without an edit event', async ({ page }) => {
  await page.getByRole('button', { name: 'Extern ändern' }).click()
  await expect(input(page)).toHaveValue(/data-external="1"/)
  await expect(layer(page)).toContainText('data-external')
  await expect(log(page)).toContainText('external: 1')
  await page.waitForTimeout(600)
  const lines = (await log(page).innerText()).split('\n')
  expect(lines.filter((l) => l.startsWith('edit:'))).toHaveLength(0)
})

test('the error box shows the translated message and line', async ({ page }) => {
  await page.getByRole('button', { name: 'Fehler ein/aus' }).click()
  const box = page.getByTestId('source-error')
  await expect(box).toHaveAttribute('role', 'alert')
  await expect(box).toContainText('Zeile 3')
  await expect(box).toContainText('„g“')
})

test('light and dark screenshots', async ({ page }) => {
  await page.getByRole('button', { name: 'Fehler ein/aus' }).click()
  await setDark(page, false)
  await page.screenshot({ path: 'screenshots/source.png', fullPage: true })
  await setDark(page, true)
  await expect(input(page)).toBeVisible()
  await page.screenshot({ path: 'screenshots/source-dark.png', fullPage: true })
})
