// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import SourceEditor from '../../src/app/components/SourceEditor.vue'
import { padTrailingNewline } from '../../src/app/components/highlight'
import de from '../../src/shared/locales/de/source.json'
import en from '../../src/shared/locales/en/source.json'

const SAMPLE = '<svg xmlns="http://www.w3.org/2000/svg">\n  <rect x="1"/>\n</svg>'

function i18n() {
  return createI18n({
    legacy: true,
    locale: 'de',
    fallbackLocale: 'en',
    messages: { de: { source: de }, en: { source: en } },
  })
}

function mountEditor(props: Record<string, unknown> = {}, attachTo?: HTMLElement) {
  return mount(SourceEditor, {
    props: { modelValue: SAMPLE, error: null, ...props },
    global: { plugins: [i18n()] },
    attachTo,
  })
}

const textarea = (w: VueWrapper) => w.get('[data-testid="source-input"]').element as HTMLTextAreaElement
const layer = (w: VueWrapper) => w.get('[data-testid="source-highlight"]').element as HTMLElement

describe('SourceEditor', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('emits edit once, 300 ms after the last keystroke', async () => {
    const w = mountEditor()
    await w.get('[data-testid="source-input"]').setValue('<svg/>')
    vi.advanceTimersByTime(299)
    expect(w.emitted('edit')).toBeUndefined()
    vi.advanceTimersByTime(1)
    expect(w.emitted('edit')).toEqual([['<svg/>']])
    vi.advanceTimersByTime(1000)
    expect(w.emitted('edit')).toHaveLength(1)
  })

  it('restarts the debounce on every keystroke', async () => {
    const w = mountEditor()
    await w.get('[data-testid="source-input"]').setValue('a')
    vi.advanceTimersByTime(200)
    await w.get('[data-testid="source-input"]').setValue('ab')
    vi.advanceTimersByTime(200)
    expect(w.emitted('edit')).toBeUndefined()
    vi.advanceTimersByTime(100)
    expect(w.emitted('edit')).toEqual([['ab']])
  })

  it('never emits edit when modelValue changes from the parent', async () => {
    const w = mountEditor()
    await w.setProps({ modelValue: '<svg id="outside"/>' })
    vi.advanceTimersByTime(5000)
    expect(w.emitted('edit')).toBeUndefined()
    expect(textarea(w).value).toBe('<svg id="outside"/>')
  })

  it('does not overwrite typing with the echo of its own edit', async () => {
    const w = mountEditor({}, document.body)
    const ta = textarea(w)
    ta.focus()
    await w.get('[data-testid="source-input"]').setValue('<svg>a</svg>')
    vi.advanceTimersByTime(300)
    await w.get('[data-testid="source-input"]').setValue('<svg>ab</svg>')
    await w.setProps({ modelValue: '<svg>a</svg>' }) // echo of the emitted text
    expect(textarea(w).value).toBe('<svg>ab</svg>')
    w.unmount()
  })

  it('takes a parent value over typing when focused and the value is not the last echo', async () => {
    const w = mountEditor({}, document.body)
    textarea(w).focus()
    await w.get('[data-testid="source-input"]').setValue('<svg>typed</svg>')
    await w.setProps({ modelValue: '<svg>from canvas</svg>' })
    expect(textarea(w).value).toBe('<svg>from canvas</svg>')
    vi.advanceTimersByTime(1000)
    expect(w.emitted('edit')).toBeUndefined()
    w.unmount()
  })

  it('inserts two spaces at the caret on Tab and keeps focus', async () => {
    const w = mountEditor({ modelValue: 'ab' }, document.body)
    const ta = textarea(w)
    ta.value = 'ab'
    ta.setSelectionRange(1, 1)
    await w.get('[data-testid="source-input"]').trigger('keydown', { key: 'Tab' })
    expect(ta.value).toBe('a  b')
    expect(ta.selectionStart).toBe(3)
    expect(ta.selectionEnd).toBe(3)
    vi.advanceTimersByTime(300)
    expect(w.emitted('edit')).toEqual([['a  b']])
    w.unmount()
  })

  it('replaces a selection with the two spaces on Tab', async () => {
    const w = mountEditor({ modelValue: 'abcd' }, document.body)
    const ta = textarea(w)
    ta.value = 'abcd'
    ta.setSelectionRange(1, 3)
    await w.get('[data-testid="source-input"]').trigger('keydown', { key: 'Tab' })
    expect(ta.value).toBe('a  d')
    w.unmount()
  })

  it('blurs the textarea on Escape', async () => {
    const w = mountEditor({}, document.body)
    const ta = textarea(w)
    ta.focus()
    expect(document.activeElement).toBe(ta)
    await w.get('[data-testid="source-input"]').trigger('keydown', { key: 'Escape' })
    expect(document.activeElement).not.toBe(ta)
    w.unmount()
  })

  it('highlights the text with highlight.js classes', () => {
    const w = mountEditor({ modelValue: '<svg id="a"/>' })
    expect(layer(w).getAttribute('aria-hidden')).toBe('true')
    expect(layer(w).querySelector('.hljs-tag')).not.toBeNull()
    expect(layer(w).querySelector('.hljs-attr')?.textContent).toBe('id')
    expect(layer(w).textContent).toBe('<svg id="a"/>')
  })

  it('adds one space to the colour layer when the text ends with a newline', () => {
    const w = mountEditor({ modelValue: 'a\n' })
    expect(layer(w).textContent).toBe('a\n ')
    expect(textarea(w).value).toBe('a\n')
    expect(padTrailingNewline('a')).toBe('a')
    expect(padTrailingNewline('a\n')).toBe('a\n ')
  })

  it('follows parent changes in the colour layer', async () => {
    const w = mountEditor({ modelValue: '<svg/>' })
    await w.setProps({ modelValue: '<g></g>' })
    expect(layer(w).textContent).toBe('<g></g>')
  })

  it('shows the translated error with the line', async () => {
    const w = mountEditor({ error: { key: 'svg.error.mismatchedTag', line: 3, params: { tag: 'g' } } })
    const alert = w.get('[data-testid="source-error"]')
    expect(alert.attributes('role')).toBe('alert')
    expect(alert.text()).toContain(de.errors.mismatchedTag.replace('{tag}', 'g'))
    expect(alert.text()).toContain(de.line.replace('{line}', '3'))
    await w.setProps({ error: null })
    expect(w.find('[data-testid="source-error"]').exists()).toBe(false)
  })

  it('falls back to the syntax message for an unknown error key', () => {
    const w = mountEditor({ error: { key: 'svg.error.doesNotExist' } })
    expect(w.get('[data-testid="source-error"]').text()).toBe(de.errors.syntax)
  })

  it('has the same keys in de and en', () => {
    const flat = (o: Record<string, unknown>, p = ''): string[] =>
      Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' && v ? flat(v as Record<string, unknown>, `${p}${k}.`) : [p + k]))
    expect(flat(en).sort()).toEqual(flat(de).sort())
    const raw = readFileSync(join(import.meta.dirname, '../../src/shared/locales/en/source.json'), 'utf8')
    expect(JSON.parse(raw)).toEqual(en)
  })
})
