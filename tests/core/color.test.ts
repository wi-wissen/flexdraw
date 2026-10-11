import { describe, expect, it } from 'vitest'
import { isHex6, normalizeHex } from '../../src/core/color'
import { allPaletteHex, PALETTE, SHADES } from '../../src/core/palette'

describe('normalizeHex', () => {
  it('expands 3-digit codes and lowercases', () => {
    expect(normalizeHex('#abc')).toBe('#aabbcc')
    expect(normalizeHex('FFC93C')).toBe('#ffc93c')
    expect(normalizeHex('  #FfC93c ')).toBe('#ffc93c')
  })
  it('accepts input without #', () => {
    expect(normalizeHex('f00')).toBe('#ff0000')
  })
  it('rejects invalid values', () => {
    for (const bad of ['', '#', '#abcd', '#12345', 'ggg', '#1234567', 'red']) expect(normalizeHex(bad)).toBeNull()
  })
})

describe('palette', () => {
  it('has 15 colour families + slate + stone, 5 shades each', () => {
    expect(PALETTE).toHaveLength(17)
    expect(SHADES).toEqual([200, 400, 500, 600, 800])
    for (const f of PALETTE) expect(Object.keys(f.hex)).toHaveLength(5)
  })
  it('contains only valid six-digit lowercase hex values', () => {
    for (const h of allPaletteHex()) expect(isHex6(h)).toBe(true)
  })
  it('has no duplicate values', () => {
    const all = allPaletteHex()
    expect(new Set(all).size).toBe(all.length)
  })
})
