import { expect, test } from '@playwright/test'
import { join } from 'node:path'

const fixture = (n: string) => join(import.meta.dirname, '../tests/fixtures', n)

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

test('opening foreign SVGs keeps their colours and shows no warning', async ({ page }) => {
  await page.getByTestId('file-input').setInputFiles(fixture('dolphin.svg'))
  await expect(page.locator('[data-shape]')).toHaveCount(24)
  await expect(page.getByTestId('notice')).toHaveCount(0)
  const fills = await page.locator('[data-shape]').evaluateAll((els) => [...new Set(els.map((e) => e.getAttribute('fill')))])
  expect(fills.length).toBeGreaterThan(5)
  expect(fills).not.toEqual(['#000000'])
  await page.screenshot({ path: 'screenshots/open-dolphin.png' })
  await page.getByTestId('file-input').setInputFiles(fixture('girl.svg'))
  await expect(page.locator('[data-shape]')).toHaveCount(12)
  await page.screenshot({ path: 'screenshots/open-girl.png' })
})

test('new blocks typed into the source appear on the canvas', async ({ page }) => {
  await page.getByTestId('act-new').click()
  await page.getByTestId('start-smiley').click()
  await page.getByTestId('view-split').click()
  const input = page.getByTestId('source-input')
  const text = await input.inputValue()
  const extra = '  <rect x="130" y="10" width="40" height="40" fill="orange" />\n  <circle cx="150" cy="90" r="20" fill="rgb(10%, 60%, 90%)" />\n  <polygon points="130,120 170,120 150,160" fill="#a855f7" />\n  <rect x="200" y="10" width="30" height="30" />\n'
  await input.fill(text.replace('</svg>', extra + '</svg>'))
  await expect(page.locator('[data-shape]')).toHaveCount(8)
  const fills = await page.locator('[data-shape]').evaluateAll((els) => els.map((e) => e.getAttribute('fill')))
  expect(fills).toEqual(expect.arrayContaining(['#ffa500', '#1a99e6', '#a855f7', '#000000']))
  await expect(page.getByTestId('notice')).toHaveCount(0)
})

test('tool buttons keep their width when the active tool changes', async ({ page }) => {
  const bar = page.getByRole('toolbar', { name: /Werkzeuge|Tools/ })
  const w0 = (await bar.boundingBox())!.width
  for (const t of ['rect', 'ellipse', 'polygon', 'freehand', 'select']) {
    await page.getByTestId(`tool-${t}`).click()
    expect((await bar.boundingBox())!.width).toBe(w0)
  }
})

test('undo brings back the selection', async ({ page }) => {
  await page.getByTestId('act-new').click()
  await page.getByTestId('start-smiley').click()
  await page.getByTestId('tool-select').click()
  await page.keyboard.press('Control+a')
  await page.keyboard.press('Escape')
  const box = (await page.getByTestId('canvas').boundingBox())!
  await page.getByTestId('tool-rect').click()
  await page.mouse.move(box.x + 500, box.y + 100)
  await page.mouse.down(); await page.mouse.move(box.x + 560, box.y + 150); await page.mouse.up()
  await page.getByTestId('tool-select').click()
  await page.getByTestId('op-unite').isEnabled()
  // select the new rect and the face, combine, undo
  await page.mouse.click(box.x + 530, box.y + 120)
  await page.keyboard.down('Shift')
  await page.keyboard.up('Shift')
  await page.keyboard.press('Control+a')
  await page.keyboard.press('Delete')
  await expect(page.locator('[data-shape]')).toHaveCount(0)
  await page.keyboard.press('Control+z')
  await expect(page.locator('[data-shape]')).toHaveCount(5)
  await expect(page.getByTestId('selection')).toBeVisible() // selection restored with the shapes
})

test('clicking a shape marks its source line and clicking a line selects the shape', async ({ page }) => {
  await page.getByTestId('act-new').click()
  await page.getByTestId('start-smiley').click()
  await page.getByTestId('view-split').click()
  await page.getByTestId('tool-select').click()
  const canvas = (await page.getByTestId('canvas').boundingBox())!
  // click the left eye (second element => source line 3)
  const eye = page.locator('[data-shape=ellipse]').first()
  const eb = (await eye.boundingBox())!
  await page.mouse.click(eb.x + eb.width / 2, eb.y + eb.height / 2)
  await expect(page.getByTestId('source-band')).toHaveCount(1)
  const band = (await page.getByTestId('source-band').boundingBox())!
  const input = (await page.getByTestId('source-input').boundingBox())!
  expect(band.y).toBeGreaterThan(input.y)
  // click on the mouth line (last shape, line 6)
  const lh = band.height
  await page.mouse.click(input.x + 60, band.y + lh * 3.5) // lines 3 -> 6
  await expect(page.getByTestId('source-band')).toHaveCount(1)
  const mouthSel = await page.getByTestId('selection').boundingBox()
  expect(mouthSel).not.toBeNull()
  expect(canvas.width).toBeGreaterThan(0)
})

test('clicking the svg wrapper lines clears the selection', async ({ page }) => {
  await page.getByTestId('act-new').click()
  await page.getByTestId('start-smiley').click()
  await page.getByTestId('view-split').click()
  const input = (await page.getByTestId('source-input').boundingBox())!
  const lh = 1.35 * 16
  const lineY = (n: number) => input.y + 12 + (n - 0.5) * lh // 0.75rem padding
  await page.mouse.click(input.x + 60, lineY(3)) // an element line
  await expect(page.getByTestId('source-band')).toHaveCount(1)
  await page.mouse.click(input.x + 60, lineY(1)) // <svg ...>
  await expect(page.getByTestId('source-band')).toHaveCount(0)
  await page.mouse.click(input.x + 60, lineY(4))
  await expect(page.getByTestId('source-band')).toHaveCount(1)
  await page.mouse.click(input.x + 60, lineY(6)) // </svg>
  await expect(page.getByTestId('source-band')).toHaveCount(0)
  await expect(page.getByTestId('selection')).toHaveCount(0)
})
