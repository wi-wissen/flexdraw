import { describe, expect, it } from 'vitest'
import { Editor } from '../../src/core/editor'
import { shapeArea } from '../../src/core/paperBridge'
import { smileyScene } from '../../src/core/templates'
import type { RectShape } from '../../src/core/types'

const sq = (id: string, x: number, y: number, fill = '#ff0000'): RectShape => ({
  kind: 'rect', id, x, y, width: 10, height: 10, rotation: 0, fill, stroke: 'none', strokeWidth: 0,
})
const ids = (e: Editor) => e.scene.shapes.map((s) => s.id)

describe('booleans (two 10x10 squares offset by 5)', () => {
  const area = (op: 'unite' | 'intersect' | 'subtract' | 'exclude') => {
    const e = new Editor()
    e.add(sq('a', 0, 0))
    e.add(sq('b', 5, 5, '#00ff00'))
    e.select(['a', 'b'])
    expect(e.applyBoolean(op)).toBe(true)
    expect(e.scene.shapes).toHaveLength(1)
    const r = e.scene.shapes[0]!
    expect(r.kind).toBe('path')
    expect(r.fill).toBe('#ff0000') // fill of the lower shape
    return Math.round(shapeArea(r))
  }
  it('unite = 175', () => expect(area('unite')).toBe(175))
  it('intersect = 25', () => expect(area('intersect')).toBe(25))
  it('subtract = 75', () => expect(area('subtract')).toBe(75))
  it('exclude = 150', () => expect(area('exclude')).toBe(150))
  it('needs exactly two shapes', () => {
    const e = new Editor()
    e.add(sq('a', 0, 0))
    expect(e.canBoolean).toBe(false)
    expect(e.applyBoolean('unite')).toBe(false)
  })
})

describe('z-order', () => {
  const make = () => {
    const e = new Editor()
    for (const id of ['a', 'b', 'c', 'd']) e.add(sq(id, 0, 0))
    return e
  }
  it('front / back', () => {
    const e = make(); e.select(['b']); e.reorder('front'); expect(ids(e)).toEqual(['a', 'c', 'd', 'b'])
    e.reorder('back'); expect(ids(e)).toEqual(['b', 'a', 'c', 'd'])
  })
  it('forward / backward by one', () => {
    const e = make(); e.select(['b']); e.reorder('forward'); expect(ids(e)).toEqual(['a', 'c', 'b', 'd'])
    e.reorder('backward'); e.reorder('backward'); expect(ids(e)).toEqual(['b', 'a', 'c', 'd'])
    e.reorder('backward'); expect(ids(e)).toEqual(['b', 'a', 'c', 'd'])
  })
  it('moves a multi selection together', () => {
    const e = make(); e.select(['a', 'b']); e.reorder('forward'); expect(ids(e)).toEqual(['c', 'a', 'b', 'd'])
  })
})

describe('undo / redo', () => {
  it('walks over many steps and clears redo on new edits', () => {
    const e = new Editor()
    for (let i = 0; i < 60; i++) e.add(sq(`s${i}`, i, 0))
    expect(e.scene.shapes).toHaveLength(60)
    for (let i = 0; i < 55; i++) e.undo()
    expect(e.scene.shapes).toHaveLength(5)
    e.redo(); e.redo()
    expect(e.scene.shapes).toHaveLength(7)
    e.add(sq('x', 0, 0))
    expect(e.canRedo).toBe(false)
    expect(e.scene.shapes).toHaveLength(8)
  })
  it('keeps at least 50 steps', () => {
    const e = new Editor()
    for (let i = 0; i < 80; i++) e.add(sq(`s${i}`, i, 0))
    let n = 0
    while (e.canUndo) { e.undo(); n++ }
    expect(n).toBeGreaterThanOrEqual(50)
  })
  it('preview does not create history entries', () => {
    const e = new Editor()
    e.add(sq('a', 0, 0))
    e.preview({ shapes: [sq('a', 5, 5)] })
    e.preview({ shapes: [sq('a', 9, 9)] })
    e.commit({ shapes: [sq('a', 9, 9)] })
    e.undo()
    expect((e.scene.shapes[0] as RectShape).x).toBe(0)
  })
})

describe('editing', () => {
  it('style goes to selection, or to the default style without selection', () => {
    const e = new Editor()
    e.setStyle({ fill: '#123456' })
    expect(e.defaultStyle.fill).toBe('#123456')
    e.add(sq('a', 0, 0))
    e.setStyle({ fill: '#abcdef' })
    expect(e.scene.shapes[0]!.fill).toBe('#abcdef')
    expect(e.defaultStyle.fill).toBe('#123456')
  })
  it('duplicate, delete, move, rotate', () => {
    const e = new Editor()
    e.add(sq('a', 0, 0))
    e.duplicate()
    expect(e.scene.shapes).toHaveLength(2)
    expect(e.selection).toHaveLength(1)
    e.move(3, 4)
    expect((e.scene.shapes[1] as RectShape).x).toBe(13)
    e.rotateSelection(90)
    expect((e.scene.shapes[1] as RectShape).rotation).toBe(90)
    e.deleteSelection()
    expect(e.scene.shapes).toHaveLength(1)
  })
})

describe('source sync', () => {
  it('changes from the source are flagged so they are not written back', () => {
    const e = new Editor()
    const seen: string[] = []
    e.onChange((o) => seen.push(o))
    const r = e.applySource('<svg><circle cx="5" cy="5" r="3" fill="#ff0000"/></svg>')
    expect(r.ok).toBe(true)
    expect(seen).toEqual(['source'])
    e.add(sq('a', 0, 0))
    expect(seen.at(-1)).toBe('scene')
  })
  it('invalid SVG keeps the scene and reports an error with a line', () => {
    const e = new Editor(smileyScene())
    const before = e.scene
    const r = e.applySource('<svg>\n<rect\n</svg>')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.key).toMatch(/^svg\.error\./)
    expect(e.scene).toBe(before)
  })
})
