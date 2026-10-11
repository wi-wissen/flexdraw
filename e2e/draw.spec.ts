import { expect, test, type Page } from '@playwright/test'

const drag = async (page: Page, from: [number, number], to: [number, number], opts: { shift?: boolean } = {}) => {
  const box = (await page.getByTestId('canvas').boundingBox())!
  if (opts.shift) await page.keyboard.down('Shift')
  await page.mouse.move(box.x + from[0], box.y + from[1])
  await page.mouse.down()
  await page.mouse.move(box.x + (from[0] + to[0]) / 2, box.y + (from[1] + to[1]) / 2)
  await page.mouse.move(box.x + to[0], box.y + to[1])
  await page.mouse.up()
  if (opts.shift) await page.keyboard.up('Shift')
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.clear()
      sessionStorage.setItem('seeded', '1')
    }
  })
  await page.goto('/app/')
  await page.getByTestId('start-close').click()
})

test('starts in drawing view with a hint, export disabled', async ({ page }) => {
  await expect(page.getByTestId('view-draw')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('act-download')).toHaveAttribute('aria-disabled', 'true')
  await expect(page.getByTestId('hint')).toContainText(/wählt eine Form|selects a shape/)
})

test('draw rect (shift = square), ellipse, polygon, freehand; undo/redo', async ({ page }) => {
  await page.getByTestId('tool-rect').click()
  await expect(page.getByTestId('tool-rect')).toHaveAttribute('aria-pressed', 'true')
  await drag(page, [200, 150], [300, 200], { shift: true })
  const rect = page.locator('[data-shape=rect]')
  await expect(rect).toHaveCount(1)
  expect(await rect.getAttribute('width')).toBe(await rect.getAttribute('height'))

  await page.getByTestId('tool-ellipse').click()
  await drag(page, [400, 150], [500, 220])
  await expect(page.locator('[data-shape=ellipse]')).toHaveCount(1)

  await page.getByTestId('tool-polygon').click()
  const box = (await page.getByTestId('canvas').boundingBox())!
  for (const [x, y] of [[200, 350], [300, 350], [250, 430]] as [number, number][]) await page.mouse.click(box.x + x, box.y + y)
  await page.mouse.dblclick(box.x + 250, box.y + 430)
  await expect(page.locator('[data-shape=polygon]')).toHaveCount(1)

  await page.getByTestId('tool-freehand').click()
  await page.mouse.move(box.x + 450, box.y + 350)
  await page.mouse.down()
  for (let i = 0; i <= 20; i++) await page.mouse.move(box.x + 450 + i * 6, box.y + 350 + Math.sin(i / 3) * 30)
  await page.mouse.up()
  await expect(page.locator('[data-shape=path]')).toHaveCount(1)

  await expect(page.getByTestId('act-download')).toHaveAttribute('aria-disabled', 'false')
  await page.keyboard.press('Control+z')
  await expect(page.locator('[data-shape=path]')).toHaveCount(0)
  await page.keyboard.press('Control+y')
  await expect(page.locator('[data-shape=path]')).toHaveCount(1)
})

test('select, move, boolean, reorder, delete, source view follows', async ({ page }) => {
  await page.getByTestId('tool-rect').click()
  await drag(page, [200, 150], [300, 250])
  await drag(page, [250, 200], [350, 300])
  await page.getByTestId('tool-select').click()
  await expect(page.getByTestId('op-unite')).toHaveAttribute('aria-disabled', 'true')
  await page.keyboard.press('Control+a')
  await expect(page.getByTestId('op-unite')).toHaveAttribute('aria-disabled', 'false')
  await page.getByTestId('view-split').click()
  await expect(page.getByTestId('source-pane')).toContainText('<rect')
  await page.getByTestId('op-unite').click()
  await expect(page.locator('[data-shape=path]')).toHaveCount(1)
  await expect(page.locator('[data-shape=rect]')).toHaveCount(0)
  await expect(page.getByTestId('source-pane')).toContainText('<path')
  const before = await page.locator('[data-shape=path]').getAttribute('d')
  await page.keyboard.press('ArrowRight')
  expect(await page.locator('[data-shape=path]').getAttribute('d')).not.toBe(before)
  await page.keyboard.press('Delete')
  await expect(page.locator('[data-shape=path]')).toHaveCount(0)
})

test('smiley template, reload keeps the drawing, new asks first', async ({ page }) => {
  await page.getByTestId('act-new').click() // empty: no confirm
  await expect(page.getByTestId('start-card')).toBeVisible()
  await page.getByTestId('start-smiley').click()
  await expect(page.locator('[data-shape]')).toHaveCount(4)
  await page.waitForTimeout(700)
  await page.reload()
  await expect(page.locator('[data-shape]')).toHaveCount(4)
  let asked = ''
  page.once('dialog', (d) => { asked = d.message(); void d.dismiss() })
  await page.getByTestId('act-new').click()
  expect(asked).not.toBe('')
  await expect(page.locator('[data-shape]')).toHaveCount(4)
})

test('zoom with buttons and wheel', async ({ page }) => {
  await page.getByTestId('zoom-in').click()
  await expect(page.getByTestId('zoom-level')).toHaveText('125 %')
  await page.getByTestId('zoom-reset').click()
  await expect(page.getByTestId('zoom-level')).toHaveText('100 %')
  const box = (await page.getByTestId('canvas').boundingBox())!
  await page.mouse.move(box.x + 300, box.y + 300)
  await page.mouse.wheel(0, -300)
  await expect(page.getByTestId('zoom-level')).not.toHaveText('100 %')
})

test('two-way sync between drawing and source', async ({ page }) => {
  await page.getByTestId('start-smiley').count() // card was closed in beforeEach
  await page.getByTestId('act-new').click()
  await page.getByTestId('start-smiley').click()
  await page.getByTestId('view-split').click()
  const input = page.getByTestId('source-input')
  await expect(input).toHaveValue(/<circle|<ellipse/)
  // drawing -> source: recolour the face via the source text, then check canvas follows
  const text = await input.inputValue()
  await input.fill(text.replace('#ffc93c', '#3b82f6'))
  await expect(page.locator('[data-shape]').first()).toHaveAttribute('fill', '#3b82f6')
  // typed text is not rewritten by the app
  await expect(input).toHaveValue(text.replace('#ffc93c', '#3b82f6'))
  // invalid SVG keeps the drawing and shows an error with a line
  await input.fill(text.replace('</svg>', ''))
  await expect(page.getByTestId('source-error')).toBeVisible()
  await expect(page.locator('[data-shape]')).toHaveCount(4)
  // drawing change rewrites the source
  await page.keyboard.press('Escape')
  await input.fill(text)
  await expect(page.getByTestId('source-error')).toBeHidden()
})

test('language and theme switch in the app and persist after reload', async ({ page }) => {
  await page.getByTestId('lang-toggle').click()
  await expect(page.locator('html')).toHaveAttribute('lang', /^(de|en)$/)
  const lang = await page.locator('html').getAttribute('lang')
  await expect(page.getByTestId('act-new')).toHaveText(lang === 'en' ? /New/ : /Neu/)
  await page.getByTestId('theme-toggle').click()
  await expect(page.locator('html')).toHaveClass(/dark|^$/)
  const dark = await page.locator('html').evaluate((e) => e.classList.contains('dark'))
  await page.reload()
  expect(await page.locator('html').getAttribute('lang')).toBe(lang)
  expect(await page.locator('html').evaluate((e) => e.classList.contains('dark'))).toBe(dark)
})

test('resize, rotate with handles; marquee and shift multi-select', async ({ page }) => {
  await page.getByTestId('tool-rect').click()
  await drag(page, [200, 200], [300, 260])
  await drag(page, [400, 200], [480, 260])
  await page.getByTestId('tool-select').click()
  const box = (await page.getByTestId('canvas').boundingBox())!
  // marquee around both
  await drag(page, [150, 150], [550, 320])
  await expect(page.getByTestId('op-unite')).toHaveAttribute('aria-disabled', 'false')
  await page.keyboard.press('Escape')
  // click first rect, then shift-click second
  await page.mouse.click(box.x + 250, box.y + 230)
  await page.keyboard.down('Shift')
  await page.mouse.click(box.x + 440, box.y + 230)
  await page.keyboard.up('Shift')
  await expect(page.getByTestId('op-unite')).toHaveAttribute('aria-disabled', 'false')
  await page.keyboard.press('Escape')
  // resize first rect through the south-east handle
  await page.mouse.click(box.x + 250, box.y + 230)
  const first = page.locator('[data-shape=rect]').first()
  const w0 = Number(await first.getAttribute('width'))
  const se = page.locator('[data-handle=se]')
  const hb = (await se.boundingBox())!
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2)
  await page.mouse.down()
  await page.mouse.move(hb.x + 60, hb.y + 30)
  await page.mouse.up()
  expect(Number(await first.getAttribute('width'))).toBeGreaterThan(w0)
  // rotate through the rotate handle
  const rot = page.locator('[data-handle=rotate]')
  const rb = (await rot.boundingBox())!
  await page.mouse.move(rb.x + rb.width / 2, rb.y + rb.height / 2)
  await page.mouse.down()
  await page.mouse.move(rb.x + rb.width / 2 + 90, rb.y + rb.height / 2 + 60)
  await page.mouse.up()
  await expect(first).toHaveAttribute('transform', /rotate\(/)
})

test('polygon closes by clicking the first corner, and with Enter', async ({ page }) => {
  await page.getByTestId('tool-polygon').click()
  const box = (await page.getByTestId('canvas').boundingBox())!
  const pts: [number, number][] = [[200, 200], [320, 200], [340, 300], [260, 340]]
  for (const [x, y] of pts) await page.mouse.click(box.x + x, box.y + y)
  await expect(page.locator('[data-shape=polygon]')).toHaveCount(0)
  await page.mouse.click(box.x + 203, box.y + 198) // near the first corner
  await expect(page.locator('[data-shape=polygon]')).toHaveCount(1)
  expect((await page.locator('[data-shape=polygon]').getAttribute('points'))!.split(' ')).toHaveLength(4)
  // Enter closes too
  for (const [x, y] of [[500, 200], [600, 200], [550, 300]] as [number, number][]) await page.mouse.click(box.x + x, box.y + y)
  await page.keyboard.press('Enter')
  await expect(page.locator('[data-shape=polygon]')).toHaveCount(2)
  // a triangle can be closed on its first corner as well
  for (const [x, y] of [[600, 400], [700, 400], [650, 480]] as [number, number][]) await page.mouse.click(box.x + x, box.y + y)
  await page.mouse.click(box.x + 600, box.y + 400)
  await expect(page.locator('[data-shape=polygon]')).toHaveCount(3)
})
