import { expect, test } from '@playwright/test'

test('all three pages load without third-party requests', async ({ page, baseURL }) => {
  const foreign: string[] = []
  page.on('request', (r) => {
    if (!r.url().startsWith(baseURL!) && !r.url().startsWith('data:')) foreign.push(r.url())
  })
  for (const path of ['/', '/app/', '/help/']) {
    await page.goto(path)
    await expect(page.locator('header')).toBeVisible()
  }
  expect(foreign).toEqual([])
})
