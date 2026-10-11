import { expect, test } from '@playwright/test'

test('credits page lists the main libraries and links out safely', async ({ page }) => {
  await page.goto('/credits/')
  await expect(page.locator('h1')).toBeVisible()
  for (const k of ['vue', 'paper', 'hljs', 'tailwind', 'i18n']) await expect(page.getByTestId(`credit-${k}`)).toBeVisible()
  const links = await page.locator('main a').evaluateAll((as) => as.map((a) => [a.getAttribute('href'), a.getAttribute('rel')]))
  for (const [href, rel] of links) {
    expect(href).toMatch(/^https:\/\//)
    expect(rel).toContain('noopener')
  }
  await expect(page.locator('footer a[href*="github.com/wi-wissen/flexdraw"]')).toBeVisible()
})

test('help page has the footer, no SQL block, the anatomy section and the freesvg tip', async ({ page }) => {
  await page.goto('/help/')
  await expect(page.locator('footer a[href="../credits/"]')).toBeVisible()
  await expect(page.locator('body')).not.toContainText(/SQL|JOIN/)
  await expect(page.locator('#svg h3').first()).toBeVisible()
  await expect(page.locator('a[href="https://freesvg.org/"]')).toHaveAttribute('rel', /noopener/)
  // first steps: two columns, so the four steps form two rows
  const tops = await page.locator('.help-step').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)))
  expect(new Set(tops).size).toBe(2)
})

test('landing, help and credits share one identical footer', async ({ page }) => {
  const seen: { text: string; links: string[]; height: number }[] = []
  for (const path of ['/', '/help/', '/credits/']) {
    await page.addInitScript(() => localStorage.setItem('flexdraw.lang', 'de'))
    await page.goto(path)
    const footer = page.locator('footer.fd-footer')
    await expect(footer).toBeVisible()
    seen.push({
      text: (await footer.innerText()).replace(/\s+/g, ' '),
      links: await footer.locator('a').evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).pathname + (a as HTMLAnchorElement).host)),
      height: Math.round((await footer.boundingBox())!.height),
    })
  }
  expect(seen[1]!.text).toBe(seen[0]!.text)
  expect(seen[2]!.text).toBe(seen[0]!.text)
  expect(seen[1]!.links).toEqual(seen[0]!.links)
  expect(seen[2]!.links).toEqual(seen[0]!.links)
  expect(seen[1]!.height).toBe(seen[0]!.height)
  expect(seen[2]!.height).toBe(seen[0]!.height)
})
