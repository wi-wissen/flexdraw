import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'

test('ColorPicker: swatch, hex input and error message in a real browser', async ({ page }) => {
  await page.goto('/harness/colorpicker/')

  const fill = page.getByRole('group', { name: 'Füllung', exact: true })
  const stroke = page.getByRole('group', { name: 'Kontur', exact: true })
  await expect(fill).toBeVisible()
  await expect(stroke).toBeVisible()

  // Clicking a swatch selects it: aria-pressed plus a check mark inside the button.
  const blue = fill.getByTestId('swatch-green-500')
  await blue.click()
  await expect(blue).toHaveAttribute('aria-pressed', 'true')
  await expect(blue.locator('svg')).toHaveCount(1)
  await expect(fill.getByTestId('hex-input')).toHaveValue('#22c55e')

  // Short hex typed without # is normalised on Enter.
  const hex = fill.getByTestId('hex-input')
  await hex.fill('abc')
  await hex.press('Enter')
  await expect(hex).toHaveValue('#aabbcc')
  await expect(fill.getByTestId('swatch-green-500')).toHaveAttribute('aria-pressed', 'false')

  // Invalid input: alert shown, the picker keeps its last valid colour.
  await hex.fill('zz')
  await hex.press('Enter')
  await expect(fill.getByRole('alert')).toBeVisible()
  await expect(fill.getByTestId('hex-error')).toBeVisible()
  await expect(fill.getByTestId('swatch-blue-500')).not.toHaveAttribute('aria-pressed', 'true')
  await expect(fill.getByTestId('swatch-blue-500')).toHaveAttribute('aria-pressed', 'false')
  await expect(stroke.getByRole('alert')).toHaveCount(0)

  const dir = resolve(process.cwd(), 'screenshots')
  mkdirSync(dir, { recursive: true })
  await page.screenshot({ path: resolve(dir, 'colorpicker.png'), fullPage: true })

  await page.evaluate(() => document.documentElement.classList.add('dark'))
  await page.screenshot({ path: resolve(dir, 'colorpicker-dark.png'), fullPage: true })
})
