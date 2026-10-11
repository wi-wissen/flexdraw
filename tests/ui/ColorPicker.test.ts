// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import ColorPicker from '../../src/app/components/ColorPicker.vue'
import deColors from '../../src/shared/locales/de/colors.json'
import enColors from '../../src/shared/locales/en/colors.json'
import { PALETTE, SHADES, BLACK, WHITE } from '../../src/core/palette'

function makeI18n(locale: 'de' | 'en' = 'de') {
  return createI18n({
    legacy: true,
    locale,
    fallbackLocale: 'en',
    messages: { de: { colors: deColors }, en: { colors: enColors } },
  })
}

function mountPicker(props: Partial<{ label: string; modelValue: string; allowNone: boolean }> = {}) {
  return mount(ColorPicker, {
    props: { label: 'Füllung', modelValue: '#000000', ...props },
    global: { plugins: [makeI18n()] },
  })
}

const ALL_SWATCH_IDS = [
  ...PALETTE.flatMap((f) => SHADES.map((s) => `swatch-${f.family}-${s}`)),
  'swatch-black',
  'swatch-white',
]

describe('ColorPicker', () => {
  it('clicking a swatch emits its hex', async () => {
    const w = mountPicker()
    await w.get('[data-testid="swatch-blue-500"]').trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([['#3b82f6']])
  })

  it('black and white swatches emit their hex', async () => {
    const w = mountPicker()
    await w.get('[data-testid="swatch-black"]').trigger('click')
    await w.get('[data-testid="swatch-white"]').trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([[BLACK], [WHITE]])
  })

  it('none button emits "none"', async () => {
    const w = mountPicker({ modelValue: '#ff0000' })
    await w.get('[data-testid="color-none"]').trigger('click')
    expect(w.emitted('update:modelValue')).toEqual([['none']])
  })

  it('hides the none button when allowNone is false', () => {
    const w = mountPicker({ allowNone: false })
    expect(w.find('[data-testid="color-none"]').exists()).toBe(false)
  })

  it('marks the selected swatch with aria-pressed and a check icon', () => {
    const w = mountPicker({ modelValue: '#3b82f6' })
    const selected = w.get('[data-testid="swatch-blue-500"]')
    expect(selected.attributes('aria-pressed')).toBe('true')
    expect(selected.find('svg').exists()).toBe(true)
    expect(selected.classes()).toContain('is-selected')

    const other = w.get('[data-testid="swatch-blue-400"]')
    expect(other.attributes('aria-pressed')).toBe('false')
    expect(other.find('svg').exists()).toBe(false)
  })

  it('marks the none button as selected with a check icon', () => {
    const w = mountPicker({ modelValue: 'none' })
    const none = w.get('[data-testid="color-none"]')
    expect(none.attributes('aria-pressed')).toBe('true')
    expect(none.findAll('svg').length).toBe(2)
    expect((w.get('[data-testid="hex-input"]').element as HTMLInputElement).value).toBe('')
  })

  it('shows the current hex in the input', () => {
    const w = mountPicker({ modelValue: '#ffc93c' })
    expect((w.get('[data-testid="hex-input"]').element as HTMLInputElement).value).toBe('#ffc93c')
  })

  it('normalises a 3-digit hex with # to 6 digits', async () => {
    const w = mountPicker()
    const input = w.get('[data-testid="hex-input"]')
    await input.setValue('#abc')
    await input.trigger('keydown.enter')
    expect(w.emitted('update:modelValue')).toEqual([['#aabbcc']])
  })

  it('normalises an upper-case 6-digit hex without # to lower case', async () => {
    const w = mountPicker()
    const input = w.get('[data-testid="hex-input"]')
    await input.setValue('FFC93C')
    await input.trigger('blur')
    expect(w.emitted('update:modelValue')).toEqual([['#ffc93c']])
  })

  it('shows an alert and emits nothing for invalid input', async () => {
    const w = mountPicker({ modelValue: '#000000' })
    expect(w.find('[data-testid="hex-error"]').exists()).toBe(false)
    const input = w.get('[data-testid="hex-input"]')
    await input.setValue('xyz12')
    await input.trigger('keydown.enter')
    const err = w.get('[data-testid="hex-error"]')
    expect(err.attributes('role')).toBe('alert')
    expect(err.text().length).toBeGreaterThan(0)
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('invalid input on blur also shows the alert and emits nothing', async () => {
    const w = mountPicker()
    const input = w.get('[data-testid="hex-input"]')
    await input.setValue('#12345')
    await input.trigger('blur')
    expect(w.find('[data-testid="hex-error"]').exists()).toBe(true)
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('renders the group label and a labelled group', () => {
    const w = mountPicker({ label: 'Kontur' })
    const group = w.get('[role="group"]')
    const labelledBy = group.attributes('aria-labelledby')
    expect(labelledBy).toBeTruthy()
    expect(w.get(`#${labelledBy}`).text()).toBe('Kontur')
  })

  it('every swatch has a non-empty aria-label and title', () => {
    const w = mountPicker()
    for (const id of ALL_SWATCH_IDS) {
      const el = w.get(`[data-testid="${id}"]`)
      expect(el.attributes('aria-label')?.trim(), id).toBeTruthy()
      expect(el.attributes('title'), id).toBe(el.attributes('aria-label'))
      expect(el.attributes('type'), id).toBe('button')
    }
    expect(w.get('[data-testid="swatch-blue-500"]').attributes('aria-label')).toBe('Blau 500')
  })

  it('has 87 swatches (17 families x 5 shades, black, white)', () => {
    const w = mountPicker()
    expect(w.findAll('button[data-testid^="swatch-"]').length).toBe(ALL_SWATCH_IDS.length)
    expect(ALL_SWATCH_IDS.length).toBe(87)
  })

  it('applies swatch colours as hex in an inline style', () => {
    const w = mountPicker()
    const style = w.get('[data-testid="swatch-red-500"]').attributes('style') ?? ''
    // The browser serialises hex as rgb() in the style attribute; the value is still the palette colour.
    expect(style).toContain('rgb(239, 68, 68)')
    expect(style).not.toContain('oklch')
    expect(style).not.toContain('var(')
  })
})

describe('colors locale files', () => {
  const flatKeys = (o: Record<string, unknown>, prefix = ''): string[] =>
    Object.entries(o).flatMap(([k, v]) =>
      v && typeof v === 'object' ? flatKeys(v as Record<string, unknown>, `${prefix}${k}.`) : [`${prefix}${k}`],
    )

  it('de and en have identical keys', () => {
    expect(flatKeys(deColors).sort()).toEqual(flatKeys(enColors).sort())
  })

  it('has a name for every palette family and for black and white', () => {
    for (const f of PALETTE) {
      expect(deColors.family).toHaveProperty(f.family)
      expect(enColors.family).toHaveProperty(f.family)
    }
    expect(deColors).toHaveProperty('black')
    expect(deColors).toHaveProperty('white')
  })
})
