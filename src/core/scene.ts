// Pure, immutable scene operations. Every function returns a new Scene.
import { round2 } from './numfmt'
import { shapeBounds, shapeToD, transformToD } from './paperBridge'
import type { Point, Reorder, Scene, Shape, Style } from './types'

export const DEFAULT_STYLE: Style = { fill: '#ffc93c', stroke: '#0f172a', strokeWidth: 2 }

export const emptyScene = (): Scene => ({ shapes: [] })

let counter = 0
export function newId(): string {
  counter += 1
  return `s${counter}`
}

export function addShape(scene: Scene, shape: Shape): Scene {
  return { shapes: [...scene.shapes, shape] }
}

export function removeShapes(scene: Scene, ids: string[]): Scene {
  return { shapes: scene.shapes.filter((s) => !ids.includes(s.id)) }
}

export function updateShapes(scene: Scene, ids: string[], patch: Partial<Style>): Scene {
  return { shapes: scene.shapes.map((s) => (ids.includes(s.id) ? ({ ...s, ...patch } as Shape) : s)) }
}

export function replaceShape(scene: Scene, id: string, next: Shape): Scene {
  return { shapes: scene.shapes.map((s) => (s.id === id ? next : s)) }
}

export function translateShape(s: Shape, dx: number, dy: number): Shape {
  switch (s.kind) {
    case 'rect':
      return { ...s, x: round2(s.x + dx), y: round2(s.y + dy) }
    case 'ellipse':
      return { ...s, cx: round2(s.cx + dx), cy: round2(s.cy + dy) }
    case 'polygon':
      return { ...s, points: s.points.map((p) => ({ x: round2(p.x + dx), y: round2(p.y + dy) })) }
    case 'path':
      return { ...s, d: transformToD(s, [1, 0, 0, 1, dx, dy]) }
  }
}

export function translateShapes(scene: Scene, ids: string[], dx: number, dy: number): Scene {
  return { shapes: scene.shapes.map((s) => (ids.includes(s.id) ? translateShape(s, dx, dy) : s)) }
}

/** Rotates around a pivot (degrees). Rects and ellipses keep their kind. */
export function rotateShape(s: Shape, deg: number, pivot: Point): Shape {
  const rad = (deg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const rot = (x: number, y: number): Point => ({
    x: round2(pivot.x + (x - pivot.x) * cos - (y - pivot.y) * sin),
    y: round2(pivot.y + (x - pivot.x) * sin + (y - pivot.y) * cos),
  })
  switch (s.kind) {
    case 'rect': {
      const c = rot(s.x + s.width / 2, s.y + s.height / 2)
      return { ...s, x: round2(c.x - s.width / 2), y: round2(c.y - s.height / 2), rotation: normDeg(s.rotation + deg) }
    }
    case 'ellipse': {
      const c = rot(s.cx, s.cy)
      return { ...s, cx: c.x, cy: c.y, rotation: normDeg(s.rotation + deg) }
    }
    case 'polygon':
      return { ...s, points: s.points.map((p) => rot(p.x, p.y)) }
    case 'path':
      return { ...s, d: transformToD(s, [cos, sin, -sin, cos, pivot.x - pivot.x * cos + pivot.y * sin, pivot.y - pivot.x * sin - pivot.y * cos]) }
  }
}

function normDeg(d: number): number {
  const r = round2(((d % 360) + 360) % 360)
  return r === 360 ? 0 : r
}

/** Scales about an origin. Rotated rects/ellipses scale their own axes (approximation). */
export function scaleShape(s: Shape, sx: number, sy: number, origin: Point): Shape {
  const px = (x: number) => round2(origin.x + (x - origin.x) * sx)
  const py = (y: number) => round2(origin.y + (y - origin.y) * sy)
  switch (s.kind) {
    case 'rect': {
      const w = Math.abs(s.width * sx)
      const h = Math.abs(s.height * sy)
      const cx = px(s.x + s.width / 2)
      const cy = py(s.y + s.height / 2)
      return { ...s, x: round2(cx - w / 2), y: round2(cy - h / 2), width: round2(w), height: round2(h) }
    }
    case 'ellipse':
      return { ...s, cx: px(s.cx), cy: py(s.cy), rx: round2(Math.abs(s.rx * sx)), ry: round2(Math.abs(s.ry * sy)) }
    case 'polygon':
      return { ...s, points: s.points.map((p) => ({ x: px(p.x), y: py(p.y) })) }
    case 'path':
      return { ...s, d: transformToD(s, [sx, 0, 0, sy, origin.x - origin.x * sx, origin.y - origin.y * sy]) }
  }
}

export function reorder(scene: Scene, ids: string[], mode: Reorder): Scene {
  const arr = [...scene.shapes]
  const sel = arr.filter((s) => ids.includes(s.id))
  if (!sel.length) return scene
  if (mode === 'front') return { shapes: [...arr.filter((s) => !ids.includes(s.id)), ...sel] }
  if (mode === 'back') return { shapes: [...sel, ...arr.filter((s) => !ids.includes(s.id))] }
  const step = mode === 'forward' ? 1 : -1
  const order = step === 1 ? [...arr.keys()].reverse() : [...arr.keys()]
  for (const i of order) {
    const j = i + step
    if (ids.includes(arr[i]!.id) && j >= 0 && j < arr.length && !ids.includes(arr[j]!.id)) {
      ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
    }
  }
  return { shapes: arr }
}

export function duplicateShapes(scene: Scene, ids: string[], offset = 10): { scene: Scene; ids: string[] } {
  const copies = scene.shapes.filter((s) => ids.includes(s.id)).map((s) => ({ ...translateShape(s, offset, offset), id: newId() }) as Shape)
  return { scene: { shapes: [...scene.shapes, ...copies] }, ids: copies.map((c) => c.id) }
}

export function selectionBounds(scene: Scene, ids: string[]) {
  const rects = scene.shapes.filter((s) => ids.includes(s.id)).map(shapeBounds)
  if (!rects.length) return null
  const x1 = Math.min(...rects.map((r) => r.x))
  const y1 = Math.min(...rects.map((r) => r.y))
  const x2 = Math.max(...rects.map((r) => r.x + r.width))
  const y2 = Math.max(...rects.map((r) => r.y + r.height))
  return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 }
}

export { shapeToD }
