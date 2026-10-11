import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = join(import.meta.dirname, '../../src/shared/locales')
const flat = (o: any, p = ''): Record<string, unknown> =>
  Object.entries(o).reduce((a, [k, v]) => (typeof v === 'object' && v ? { ...a, ...flat(v, p + k + '.') } : { ...a, [p + k]: v }), {})
const load = (lang: string) =>
  Object.fromEntries(readdirSync(join(dir, lang)).map((f) => [f, flat(JSON.parse(readFileSync(join(dir, lang, f), 'utf8')))]))

describe('i18n', () => {
  const de = load('de')
  const en = load('en')
  it('de and en have the same files', () => expect(Object.keys(de).sort()).toEqual(Object.keys(en).sort()))
  it('every file has identical keys', () => {
    for (const f of Object.keys(de)) expect(Object.keys(de[f]!).sort(), f).toEqual(Object.keys(en[f]!).sort())
  })
  it('has no empty values', () => {
    for (const set of [de, en]) for (const f of Object.keys(set)) for (const [k, v] of Object.entries(set[f]!)) expect(String(v).trim(), `${f}:${k}`).not.toBe('')
  })
})
