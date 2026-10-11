import { expect, test } from '@playwright/test'

test.use({ hasTouch: true, viewport: { width: 1000, height: 700 } })

test('two-finger pinch zooms the canvas', async ({ page }) => {
  await page.goto('/app/')
  await page.getByTestId('start-close').click()
  const cdp = await page.context().newCDPSession(page)
  const box = (await page.getByTestId('canvas').boundingBox())!
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', d: number) =>
    cdp.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: type === 'touchEnd' ? [] : [{ x: cx - d, y: cy, id: 1 }, { x: cx + d, y: cy, id: 2 }],
    })
  await touch('touchStart', 40)
  for (const d of [60, 90, 130]) await touch('touchMove', d)
  await touch('touchEnd', 0)
  const pct = parseInt((await page.getByTestId('zoom-level').textContent())!)
  expect(pct).toBeGreaterThan(150)
})

test('a single finger draws a rectangle (pointer events)', async ({ page }) => {
  await page.goto('/app/')
  await page.getByTestId('start-close').click()
  await page.getByTestId('tool-rect').tap()
  const cdp = await page.context().newCDPSession(page)
  const box = (await page.getByTestId('canvas').boundingBox())!
  const p = (x: number, y: number) => [{ x: box.x + x, y: box.y + y, id: 1 }]
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: p(200, 200) })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: p(260, 240) })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: p(320, 280) })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expect(page.locator('[data-shape=rect]')).toHaveCount(1)
})
