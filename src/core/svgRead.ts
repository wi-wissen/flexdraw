// Safe SVG import. Only a whitelist of geometry elements and a few presentation attributes
// are read; scripts, event attributes, external references, gradients, filters and text are
// dropped (and reported as warnings). Nothing from the input is ever inserted as markup.
import { normalizeHex } from './color'
import { num, round2, roundPathData } from './numfmt'
import { transformToD } from './paperBridge'
import { newId } from './scene'
import type { ImportResult, Paint, PathShape, Scene, Shape, SvgError } from './types'
import { parseXml, XmlError, type XmlNode } from './xml'

type Matrix = [number, number, number, number, number, number]
const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0]

const NAMED: Record<string, string> = {
  black: '#000000', white: '#ffffff', red: '#ff0000', green: '#008000', lime: '#00ff00', blue: '#0000ff',
  yellow: '#ffff00', orange: '#ffa500', purple: '#800080', pink: '#ffc0cb', brown: '#a52a2a', gray: '#808080',
  grey: '#808080', cyan: '#00ffff', aqua: '#00ffff', magenta: '#ff00ff', fuchsia: '#ff00ff', navy: '#000080',
  teal: '#008080', maroon: '#800000', olive: '#808000', silver: '#c0c0c0', gold: '#ffd700',
}

interface Ctx {
  fill: Paint
  stroke: Paint
  strokeWidth: number
  matrix: Matrix
}

const GEOMETRY = new Set(['rect', 'circle', 'ellipse', 'polygon', 'polyline', 'line', 'path'])
const CONTAINERS = new Set(['g', 'svg'])
const IGNORED_SILENT = new Set(['title', 'desc', 'metadata', 'defs', 'namedview'])

export function parseColor(v: string, warn: (k: string) => void): Paint | undefined {
  const s = v.trim().toLowerCase()
  if (!s || s === 'inherit') return undefined
  if (s === 'none' || s === 'transparent') return 'none'
  if (s === 'currentcolor') return '#000000'
  if (s.startsWith('url(')) {
    warn('svg.warn.gradient')
    return '#cccccc'
  }
  const hex = normalizeHex(s)
  if (hex) return hex
  const rgb = /^rgb\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)\s*\)$/.exec(s)
  if (rgb) return '#' + [rgb[1], rgb[2], rgb[3]].map((n) => Math.min(255, +n!).toString(16).padStart(2, '0')).join('')
  if (NAMED[s]) return NAMED[s]
  warn('svg.warn.color')
  return '#000000'
}

function mul(a: Matrix, b: Matrix): Matrix {
  return [
    a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5],
  ]
}

function parseTransform(t: string | undefined): Matrix {
  let m = IDENTITY
  if (!t) return m
  for (const part of t.matchAll(/(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)/g)) {
    const a = part[2]!.split(/[\s,]+/).filter(Boolean).map(Number)
    let n: Matrix = IDENTITY
    switch (part[1]) {
      case 'matrix': if (a.length === 6) n = a as Matrix; break
      case 'translate': n = [1, 0, 0, 1, a[0] ?? 0, a[1] ?? 0]; break
      case 'scale': n = [a[0] ?? 1, 0, 0, a[1] ?? a[0] ?? 1, 0, 0]; break
      case 'rotate': {
        const r = ((a[0] ?? 0) * Math.PI) / 180
        const c = Math.cos(r), s = Math.sin(r)
        const cx = a[1] ?? 0, cy = a[2] ?? 0
        n = [c, s, -s, c, cx - cx * c + cy * s, cy - cx * s - cy * c]
        break
      }
      case 'skewX': n = [1, 0, Math.tan(((a[0] ?? 0) * Math.PI) / 180), 1, 0, 0]; break
      case 'skewY': n = [1, Math.tan(((a[0] ?? 0) * Math.PI) / 180), 0, 1, 0, 0]; break
    }
    m = mul(m, n)
  }
  return m
}

const f = (v: string | undefined, d = 0): number => {
  const n = parseFloat(v ?? '')
  return Number.isFinite(n) ? n : d
}

function styleAttrs(n: XmlNode): Record<string, string> {
  const out: Record<string, string> = {}
  for (const k of ['fill', 'stroke', 'stroke-width']) if (n.attrs[k] !== undefined) out[k] = n.attrs[k]!
  for (const decl of (n.attrs.style ?? '').split(';')) {
    const i = decl.indexOf(':')
    if (i > 0) out[decl.slice(0, i).trim()] = decl.slice(i + 1).trim()
  }
  return out
}

export function importSvg(src: string): ImportResult {
  const warnings = new Set<string>()
  const warn = (k: string) => warnings.add(k)
  let root: XmlNode
  try {
    root = parseXml(src)
  } catch (e) {
    if (e instanceof XmlError) throw e
    throw new XmlError({ key: 'svg.error.syntax' })
  }
  if (root.name.replace(/^.*:/, '') !== 'svg') throw new XmlError({ key: 'svg.error.notSvg', line: root.line })

  const shapes: Shape[] = []

  const walk = (n: XmlNode, inherited: Ctx) => {
    const name = n.name.replace(/^.*:/, '')
    if (name === 'script') return warn('svg.warn.script')
    if (['text', 'tspan', 'textPath'].includes(name)) return warn('svg.warn.text')
    if (name === 'image' || name === 'use' || name === 'foreignObject') return warn('svg.warn.external')
    if (name === 'style') return warn('svg.warn.style')
    if (name.includes('Gradient') || name === 'pattern') return warn('svg.warn.gradient')
    if (name === 'filter' || name.startsWith('fe')) return warn('svg.warn.filter')
    if (IGNORED_SILENT.has(name)) return

    const st = styleAttrs(n)
    const ctx: Ctx = {
      fill: parseColor(st.fill ?? '', warn) ?? inherited.fill,
      stroke: parseColor(st.stroke ?? '', warn) ?? inherited.stroke,
      strokeWidth: st['stroke-width'] !== undefined ? f(st['stroke-width'], inherited.strokeWidth) : inherited.strokeWidth,
      matrix: mul(inherited.matrix, parseTransform(n.attrs.transform)),
    }
    if (n.attrs.filter) warn('svg.warn.filter')

    if (CONTAINERS.has(name)) {
      for (const c of n.children) walk(c, ctx)
      return
    }
    if (!GEOMETRY.has(name)) return warn('svg.warn.unsupported')

    const style = { fill: ctx.fill, stroke: ctx.stroke, strokeWidth: round2(ctx.strokeWidth) }
    const shape = buildShape(name, n, style)
    if (shape) shapes.push(applyMatrix(shape, ctx.matrix))
  }

  walk(root, { fill: '#000000', stroke: 'none', strokeWidth: 1, matrix: IDENTITY })
  return { scene: { shapes } as Scene, warnings: [...warnings] }
}

type St = { fill: Paint; stroke: Paint; strokeWidth: number }

function buildShape(name: string, n: XmlNode, st: St): Shape | null {
  const a = n.attrs
  const id = newId()
  switch (name) {
    case 'rect':
      return { kind: 'rect', id, x: round2(f(a.x)), y: round2(f(a.y)), width: round2(f(a.width)), height: round2(f(a.height)), rotation: 0, ...st }
    case 'circle':
      return { kind: 'ellipse', id, cx: round2(f(a.cx)), cy: round2(f(a.cy)), rx: round2(f(a.r)), ry: round2(f(a.r)), rotation: 0, ...st }
    case 'ellipse':
      return { kind: 'ellipse', id, cx: round2(f(a.cx)), cy: round2(f(a.cy)), rx: round2(f(a.rx)), ry: round2(f(a.ry)), rotation: 0, ...st }
    case 'polygon': {
      const nums = (a.points ?? '').split(/[\s,]+/).filter(Boolean).map(Number)
      const points = []
      for (let i = 0; i + 1 < nums.length; i += 2) points.push({ x: round2(nums[i]!), y: round2(nums[i + 1]!) })
      return points.length >= 3 ? { kind: 'polygon', id, points, ...st } : null
    }
    case 'polyline': {
      const nums = (a.points ?? '').split(/[\s,]+/).filter(Boolean).map(Number)
      if (nums.length < 4) return null
      let d = `M ${num(nums[0]!)} ${num(nums[1]!)}`
      for (let i = 2; i + 1 < nums.length; i += 2) d += ` L ${num(nums[i]!)} ${num(nums[i + 1]!)}`
      return { kind: 'path', id, d, ...st, fill: a.fill === undefined && st.fill === '#000000' ? 'none' : st.fill }
    }
    case 'line':
      return { kind: 'path', id, d: `M ${num(f(a.x1))} ${num(f(a.y1))} L ${num(f(a.x2))} ${num(f(a.y2))}`, ...st, fill: 'none' }
    case 'path':
      return a.d ? { kind: 'path', id, d: roundPathData(a.d.trim()), ...st } : null
  }
  return null
}

function applyMatrix(s: Shape, m: Matrix): Shape {
  if (m.every((v, i) => v === IDENTITY[i])) return s
  const [a, b, c, d, e, g] = m
  const pt = (x: number, y: number) => ({ x: round2(a * x + c * y + e), y: round2(b * x + d * y + g) })
  const similar = Math.abs(a - d) < 1e-9 && Math.abs(b + c) < 1e-9
  const k = Math.hypot(a, b)
  const rot = (Math.atan2(b, a) * 180) / Math.PI
  const normRot = (r: number) => round2(((r % 360) + 360) % 360)
  if (s.kind === 'rect' && similar) {
    const ctr = pt(s.x + s.width / 2, s.y + s.height / 2)
    const w = round2(s.width * k), h = round2(s.height * k)
    return { ...s, x: round2(ctr.x - w / 2), y: round2(ctr.y - h / 2), width: w, height: h, rotation: normRot(s.rotation + rot), strokeWidth: round2(s.strokeWidth * k) }
  }
  if (s.kind === 'ellipse' && similar) {
    const ctr = pt(s.cx, s.cy)
    return { ...s, cx: ctr.x, cy: ctr.y, rx: round2(s.rx * k), ry: round2(s.ry * k), rotation: normRot(s.rotation + rot), strokeWidth: round2(s.strokeWidth * k) }
  }
  if (s.kind === 'polygon') return { ...s, points: s.points.map((p) => pt(p.x, p.y)) }
  const path = s as Shape
  const out: PathShape = { kind: 'path', id: s.id, d: transformToD(path, m), fill: s.fill, stroke: s.stroke, strokeWidth: s.strokeWidth }
  return out
}

export type { SvgError }
