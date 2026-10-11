// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import Landing from '../../src/landing/Landing.vue'
import LiveDemo from '../../src/landing/components/LiveDemo.vue'
import { demoLines, demoShapes, msUntilComplete, HOLD_MS } from '../../src/landing/demo'
import { makeI18n } from '../../src/shared/i18n'

const GITHUB = 'https://github.com/wi-wissen/flexdraw'
const localeDir = join(import.meta.dirname, '../../src/shared/locales')
const landingDir = join(import.meta.dirname, '../../src/landing')
const load = (lang: string) => JSON.parse(readFileSync(join(localeDir, lang, 'landing.json'), 'utf8')) as object

const flatKeys = (o: object, prefix = ''): string[] =>
  Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? flatKeys(v, prefix + k + '.') : [prefix + k]))

const filesIn = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? filesIn(p) : [p]
  })

function i18n(lang: 'de' | 'en') {
  localStorage.setItem('flexdraw.lang', lang)
  return makeI18n()
}

describe('Landing page', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('has one h1 and both hero CTAs with visible text and an icon', () => {
    const w = mount(Landing, { global: { plugins: [i18n('de')] } })
    expect(w.findAll('h1')).toHaveLength(1)
    const start = w.get('[data-testid="cta-start"]')
    expect(start.attributes('href')).toBe('./app/')
    expect(start.text()).toContain('Zeichnen starten')
    expect(start.find('svg').exists()).toBe(true)
    const help = w.get('[data-testid="cta-help"]')
    expect(help.attributes('href')).toBe('./help/')
    expect(help.text()).toContain('So geht’s')
    expect(help.find('svg').exists()).toBe(true)
    w.unmount()
  })

  it('links to GitHub only in the quiet lower block and the footer, with rel noopener noreferrer', () => {
    const w = mount(Landing, { global: { plugins: [i18n('en')] } })
    for (const id of ['curious-github', 'footer-github']) {
      const a = w.get(`[data-testid="${id}"]`)
      expect(a.attributes('href'), id).toBe(GITHUB)
      expect(a.attributes('rel'), id).toBe('noopener noreferrer')
      expect(a.text(), id).toContain('GitHub')
    }
    // not in the hero or the final call-to-action band
    expect(w.find('[data-testid="cta-github"]').exists()).toBe(false)
    expect(w.find('[data-testid="cta-github-2"]').exists()).toBe(false)
    expect(w.findAll('a[href="' + GITHUB + '"]')).toHaveLength(2)
    expect(w.get('[data-testid="footer-credits"]').attributes('href')).toBe('./credits/')
    expect(w.get('footer a[href="./help/"]').text()).toContain('Help')
    w.unmount()
  })

  it('every link and button has visible text and an icon', () => {
    const w = mount(Landing, { global: { plugins: [i18n('en')] } })
    for (const el of w.findAll('main a, main button, footer a')) {
      expect(el.text().trim().length, el.html()).toBeGreaterThan(0)
      expect(el.find('svg').exists(), el.html()).toBe(true)
    }
    w.unmount()
  })

  it('renders the content sections and four boolean cards', () => {
    const w = mount(Landing, { global: { plugins: [i18n('en')] } })
    for (const id of ['live', 'combine', 'files', 'privacy', 'school']) expect(w.find('#' + id).exists(), id).toBe(true)
    expect(w.findAll('[data-testid="bool-card"]')).toHaveLength(4)
    w.unmount()
  })

  it('has identical landing.json keys in de and en', () => {
    expect(flatKeys(load('de')).sort()).toEqual(flatKeys(load('en')).sort())
  })

  it('never uses v-html in src/landing', () => {
    for (const f of filesIn(landingDir)) expect(readFileSync(f, 'utf8'), f).not.toContain('v-html')
  })
})

describe('Live demo timeline', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  const shapeCount = demoShapes(0).length
  const lineCount = demoLines(0).length
  const shown = (w: ReturnType<typeof mount>) => w.findAll('[data-testid="demo-line"].is-done').length

  it('starts empty and ends with every shape and every code line', async () => {
    const w = mount(LiveDemo, { global: { plugins: [i18n('en')] } })
    expect(w.findAll('[data-testid="demo-shape"]')).toHaveLength(0)
    expect(shown(w)).toBe(0)

    await vi.advanceTimersByTimeAsync(msUntilComplete(demoLines(0)))
    expect(w.findAll('[data-testid="demo-shape"]')).toHaveLength(shapeCount)
    expect(w.findAll('[data-testid="demo-line"]')).toHaveLength(lineCount)
    expect(shown(w)).toBe(lineCount)
    expect(w.text()).toContain('</svg>')
    w.unmount()
  })

  it('loops after the hold time with the next colour cycle', async () => {
    const w = mount(LiveDemo, { global: { plugins: [i18n('en')] } })
    await vi.advanceTimersByTimeAsync(msUntilComplete(demoLines(0)) + HOLD_MS + 1)
    expect(w.findAll('[data-testid="demo-shape"]')).toHaveLength(0)
    expect(demoShapes(1)[1]!.attrs).not.toEqual(demoShapes(0)[1]!.attrs)
    w.unmount()
  })

  it('stops while paused', async () => {
    const w = mount(LiveDemo, { props: { paused: true }, global: { plugins: [i18n('en')] } })
    await vi.advanceTimersByTimeAsync(5000)
    expect(shown(w)).toBe(0)
    expect(w.get('[data-testid="demo-toggle"]').text()).toContain('Play animation')
    await w.get('[data-testid="demo-toggle"]').trigger('click')
    expect(w.emitted('toggle')).toHaveLength(1)
    w.unmount()
  })

  it('shows the finished picture without timers for reduced motion', async () => {
    const w = mount(LiveDemo, { props: { paused: true, reduced: true }, global: { plugins: [i18n('en')] } })
    await w.vm.$nextTick()
    expect(w.findAll('[data-testid="demo-shape"]')).toHaveLength(shapeCount)
    expect(shown(w)).toBe(lineCount)
    expect(vi.getTimerCount()).toBe(0)
    w.unmount()
  })
})
