// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import Help from '../../src/help/Help.vue'
import { makeI18n } from '../../src/shared/i18n'

const localeDir = join(import.meta.dirname, '../../src/shared/locales')
const load = (lang: string) => JSON.parse(readFileSync(join(localeDir, lang, 'help.json'), 'utf8')) as object

const flatKeys = (o: object, prefix = ''): string[] =>
  Object.entries(o).flatMap(([k, v]) =>
    v && typeof v === 'object' ? flatKeys(v, prefix + k + '.') : [prefix + k],
  )

function mountHelp() {
  return mount(Help, { global: { plugins: [makeI18n()] } })
}

describe('Help page', () => {
  it('has exactly one h1', () => {
    const wrapper = mountHelp()
    expect(wrapper.findAll('h1')).toHaveLength(1)
  })

  it('renders the five sections with their ids', () => {
    const wrapper = mountHelp()
    const sections = wrapper.findAll('section')
    expect(sections.map((s) => s.attributes('id'))).toEqual(['start', 'tools', 'combine', 'svg', 'shortcuts'])
    expect(wrapper.findAll('h2')).toHaveLength(5)
  })

  it('has a table caption and at least six shortcut rows', () => {
    const wrapper = mountHelp()
    const table = wrapper.find('table')
    expect(table.exists()).toBe(true)
    expect(table.find('caption').text().length).toBeGreaterThan(0)
    expect(table.findAll('tbody tr').length).toBeGreaterThanOrEqual(6)
    expect(table.findAll('th[scope="col"]').length).toBe(2)
  })

  it('gives every img-role element a non-empty aria-label', () => {
    const wrapper = mountHelp()
    const imgs = wrapper.findAll('[role="img"]')
    expect(imgs.length).toBeGreaterThan(0)
    for (const img of imgs) expect(img.attributes('aria-label')?.trim(), img.html()).toBeTruthy()
  })

  it('links the table of contents to existing section ids', () => {
    const wrapper = mountHelp()
    const links = wrapper.findAll('.help-toc a')
    expect(links).toHaveLength(5)
    for (const a of links) {
      const id = a.attributes('href')!.slice(1)
      expect(wrapper.find('#' + id).exists(), id).toBe(true)
    }
  })

  it('has identical help.json keys in de and en', () => {
    expect(flatKeys(load('de')).sort()).toEqual(flatKeys(load('en')).sort())
  })
})
