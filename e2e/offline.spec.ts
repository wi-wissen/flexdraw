import { expect, test } from '@playwright/test'

test('a loaded editor keeps working without network access', async ({ page, context }) => {
  await page.goto('/app/')
  await page.getByTestId('start-close').click()
  await context.setOffline(true)
  await page.getByTestId('tool-rect').click()
  const box = (await page.getByTestId('canvas').boundingBox())!
  await page.mouse.move(box.x + 200, box.y + 200)
  await page.mouse.down()
  await page.mouse.move(box.x + 300, box.y + 280)
  await page.mouse.up()
  await page.getByTestId('view-code').click()
  await expect(page.getByTestId('source-input')).toHaveValue(/<rect/)
  await context.setOffline(false)
})
