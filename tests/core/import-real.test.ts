import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseCssColor } from '../../src/core/cssColor'
import { Editor } from '../../src/core/editor'
import { importSvg } from '../../src/core/svgRead'
import { sceneToSvg } from '../../src/core/svgWrite'
import type { RectShape } from '../../src/core/types'

const fixture = (n: string) => readFileSync(join(import.meta.dirname, '../fixtures', n), 'utf8')

describe('CSS colours', () => {
  const hex = (s: string) => parseCssColor(s)?.hex
  it('parses percentage and decimal rgb', () => {
    expect(hex('rgb(100%, 0%, 0%)')).toBe('#ff0000')
    expect(hex('rgb(28.599548%, 48.199463%, 67.799377%)')).toBe('#497bad')
    expect(hex('rgb(255 128 0)')).toBe('#ff8000')
    expect(hex('rgba(0, 0, 255, 0.5)')).toBe('#0000ff')
  })
  it('parses hex of every length, hsl and named colours', () => {
    expect(hex('#f80')).toBe('#ff8800')
    expect(hex('#ff880080')).toBe('#ff8800')
    expect(hex('hsl(120, 100%, 50%)')).toBe('#00ff00')
    expect(hex('cornflowerblue')).toBe('#6495ed')
    expect(hex('RebeccaPurple')).toBe('#663399')
  })
  it('rejects non colours', () => {
    expect(parseCssColor('url(#g)')).toBeNull()
    expect(parseCssColor('banana')).toBeNull()
  })
})

describe('real world files', () => {
  it('dolphin: no colour warning, many different colours, nothing turns black', () => {
    const r = importSvg(fixture('dolphin.svg'))
    expect(r.warnings).toEqual([])
    expect(r.scene.shapes).toHaveLength(24)
    const fills = new Set(r.scene.shapes.map((s) => s.fill))
    expect(fills.size).toBeGreaterThan(5)
    expect(r.scene.shapes[0]!.fill).toBe('#497bad')
    expect(sceneToSvg(r.scene)).not.toMatch(/rgb\(|\d\.\d{3,}/)
  })
  it('girl: style attribute is read, relative paths become absolute, fill rule kept', () => {
    const r = importSvg(fixture('girl.svg'))
    expect(r.warnings).toEqual([])
    expect(r.scene.shapes).toHaveLength(12)
    const out = sceneToSvg(r.scene)
    expect(out).toContain('fill="#000000"')
    expect(out).not.toContain('fill-rule="evenodd"') // source says nonzero
    for (const s of r.scene.shapes) if (s.kind === 'path') expect(s.d).not.toMatch(/[mlhvcsqta]/)
  })
  it('imported files are re-formatted one element per line and re-import stably', () => {
    const r = importSvg(fixture('dolphin.svg'))
    const out = sceneToSvg(r.scene)
    expect(out.trim().split('\n')).toHaveLength(26)
    expect(sceneToSvg(importSvg(out).scene)).toBe(out)
  })
})

describe('selection and source lines', () => {
  const sq = (id: string, x: number): RectShape => ({ kind: 'rect', id, x, y: 0, width: 10, height: 10, rotation: 0, fill: '#ff0000', stroke: 'none', strokeWidth: 0 })
  it('undo/redo bring back the selection of the undone step', () => {
    const e = new Editor()
    e.add(sq('a', 0))
    e.add(sq('b', 5))
    e.select(['a', 'b'])
    e.applyBoolean('unite')
    expect(e.selection).toHaveLength(1)
    e.undo()
    expect(e.selection.sort()).toEqual(['a', 'b'])
    e.redo()
    expect(e.selection).toHaveLength(1)
    expect(e.scene.shapes).toHaveLength(1)
  })
  it('selecting does not count as a scene change', () => {
    const e = new Editor()
    e.add(sq('a', 0))
    const seen: string[] = []
    e.onChange((o) => seen.push(o))
    e.select([])
    e.select(['a'])
    expect(seen).toEqual(['selection', 'selection'])
    expect(e.canUndo).toBe(true)
  })
  it('maps shapes to source lines and back', () => {
    const e = new Editor()
    e.add(sq('a', 0))
    e.add(sq('b', 5))
    expect(e.lineOfShape('a')).toBe(2)
    expect(e.lineOfShape('b')).toBe(3)
    expect(e.shapeAtLine(3)).toBe('b')
    expect(e.shapeAtLine(1)).toBeNull()
    e.applySource('<svg>\n\n<circle cx="5" cy="5" r="3"/>\n<rect width="4" height="4"/>\n</svg>')
    const [c, r] = e.scene.shapes
    expect(e.lineOfShape(c!.id)).toBe(3)
    expect(e.lineOfShape(r!.id)).toBe(4)
    expect(e.shapeAtLine(4)).toBe(r!.id)
  })
})
