import { describe, expect, it } from 'vitest'
import { Editor } from '../../src/core/editor'
import { exportBox } from '../../src/core/geometry'
import { shapeBounds } from '../../src/core/paperBridge'
import { smileyScene } from '../../src/core/templates'
import { importSvg } from '../../src/core/svgRead'
import { sceneToSvg } from '../../src/core/svgWrite'
import type { Shape } from '../../src/core/types'

const style = { fill: '#ff0000', stroke: 'none', strokeWidth: 0 }
const rect: Shape = { kind: 'rect', id: 'a', x: 1, y: 2, width: 3, height: 4, rotation: 0, ...style }
const ell: Shape = { kind: 'ellipse', id: 'b', cx: 5, cy: 5, rx: 3, ry: 2, rotation: 0, ...style }
const circ: Shape = { kind: 'ellipse', id: 'c', cx: 5, cy: 5, rx: 3, ry: 3, rotation: 0, ...style }
const poly: Shape = { kind: 'polygon', id: 'd', points: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 8.125 }], ...style }
const path: Shape = { kind: 'path', id: 'e', d: 'M 0 0 C 1.234 2 3 4 5 6', ...style }

describe('SVG output', () => {
  it('maps shape kinds to semantic elements', () => {
    const svg = sceneToSvg({ shapes: [rect, ell, circ, poly, path] })
    expect(svg).toContain('<rect ')
    expect(svg).toContain('<ellipse ')
    expect(svg).toContain('<circle ')
    expect(svg).toContain('<polygon ')
    expect(svg).toContain('<path ')
  })
  it('uses hex colours only, at most two decimals, and no internal ids', () => {
    const svg = sceneToSvg({ shapes: [{ ...rect, x: 1.23456, stroke: '#0f172a', strokeWidth: 2 }, poly, path] })
    expect(svg).not.toMatch(/\bid=/)
    expect(svg).not.toMatch(/var\(|oklch|rgb\(/)
    expect(svg).not.toMatch(/\d\.\d{3,}/)
    expect(svg).toContain('x="1.23"')
  })
  it('writes one element per line, indented', () => {
    const lines = sceneToSvg({ shapes: [rect, ell] }).trim().split('\n')
    expect(lines).toHaveLength(4)
    expect(lines[1]!.startsWith('  <rect')).toBe(true)
  })
  it('omits stroke attributes when stroke is none', () => {
    expect(sceneToSvg({ shapes: [rect] })).not.toContain('stroke')
  })
})

describe('export', () => {
  it('viewBox is the frame of all objects plus margin', () => {
    const box = exportBox({ shapes: [rect, { ...rect, id: 'z', x: 20, y: 30 }] })!
    expect(box).toEqual({ x: -9, y: -8, width: 3 + 19 + 20, height: 4 + 28 + 20 })
    expect(sceneToSvg({ shapes: [rect, { ...rect, id: 'z', x: 20, y: 30 }] })).toContain('viewBox="-9 -8 42 52"')
  })
  it('includes half the stroke width in the frame', () => {
    const box = exportBox({ shapes: [{ ...rect, stroke: '#000000', strokeWidth: 4 }] })!
    expect(box.x).toBe(1 - 2 - 10)
  })
  it('cannot export an empty drawing', () => {
    expect(exportBox({ shapes: [] })).toBeNull()
    expect(new Editor().canExport).toBe(false)
  })
})

describe('import', () => {
  const smiley = sceneToSvg(smileyScene())
  it('smiley template yields four objects', () => {
    expect(importSvg(smiley).scene.shapes).toHaveLength(4)
  })
  it('import then export leaves the smiley unchanged', () => {
    expect(sceneToSvg(importSvg(smiley).scene)).toBe(smiley)
  })
  it('smiley source stays small and mapped', () => {
    expect(smiley.trim().split('\n')).toHaveLength(6)
    expect(smiley).toContain('<circle ')
  })
  it('strips scripts, event attributes and external references', () => {
    const r = importSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><rect width="5" height="5" onclick="x()" fill="red"/><image href="http://evil/x.png"/></svg>',
    )
    expect(r.scene.shapes).toHaveLength(1)
    const out = sceneToSvg(r.scene)
    expect(out).not.toMatch(/script|onclick|http:\/\/evil|image/)
    expect(r.warnings).toEqual(expect.arrayContaining(['svg.warn.script', 'svg.warn.external']))
  })
  it('ignores gradients, filters and text with warnings', () => {
    const r = importSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g"/></defs><rect width="5" height="5" fill="url(#g)"/><text>hi</text></svg>',
    )
    expect(r.scene.shapes).toHaveLength(1)
    expect(r.warnings).toEqual(expect.arrayContaining(['svg.warn.gradient', 'svg.warn.text']))
  })
  it('flattens groups, inherits style and applies transforms', () => {
    const r = importSvg('<svg><g fill="#00ff00" transform="translate(10 20)"><rect x="1" y="1" width="2" height="2"/></g></svg>')
    const s = r.scene.shapes[0]!
    expect(s.fill).toBe('#00ff00')
    expect(shapeBounds(s)).toMatchObject({ x: 11, y: 21 })
  })
  it('reports errors with a line number', () => {
    expect(() => importSvg('<svg>\n<rect>\n</svg>')).toThrow()
    try {
      importSvg('<svg>\n\n<rect width="1"\n</svg>')
    } catch (e: any) {
      expect(e.info.key).toMatch(/^svg\.error\./)
      expect(e.info.line).toBeGreaterThan(0)
    }
    expect(() => importSvg('<html></html>')).toThrow()
  })
})
