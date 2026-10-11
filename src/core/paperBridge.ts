// The only module that touches Paper.js. Paper objects never leave this file and are
// never stored in the scene; they are built on demand from plain shape data.
import paper from 'paper'
import { num } from './numfmt'
import type { BooleanOp, PathShape, Point, Rect, Shape } from './types'

let scope: paper.PaperScope | null = null

function ps(): paper.PaperScope {
  if (!scope) {
    scope = new paper.PaperScope()
    scope.setup(new scope.Size(1, 1))
  }
  return scope
}

/** Absolute-command path data from a Paper path or compound path. */
function itemToD(item: paper.Item): string {
  const paths: paper.Path[] =
    item instanceof ps().CompoundPath ? (item.children as paper.Path[]) : [item as paper.Path]
  return paths
    .filter((p) => p.segments && p.segments.length > 1)
    .map((p) => {
      const segs = p.segments
      let d = `M ${num(segs[0]!.point.x)} ${num(segs[0]!.point.y)}`
      const curve = (a: paper.Segment, b: paper.Segment) => {
        const c1 = a.point.add(a.handleOut)
        const c2 = b.point.add(b.handleIn)
        if (a.handleOut.isZero() && b.handleIn.isZero()) {
          d += ` L ${num(b.point.x)} ${num(b.point.y)}`
        } else {
          d += ` C ${num(c1.x)} ${num(c1.y)} ${num(c2.x)} ${num(c2.y)} ${num(b.point.x)} ${num(b.point.y)}`
        }
      }
      for (let i = 1; i < segs.length; i++) curve(segs[i - 1]!, segs[i]!)
      if (p.closed) {
        curve(segs[segs.length - 1]!, segs[0]!)
        d += ' Z'
      }
      return d
    })
    .join(' ')
}

function toItem(shape: Shape): paper.Item {
  const P = ps()
  switch (shape.kind) {
    case 'rect': {
      const r = new P.Path.Rectangle(new P.Rectangle(shape.x, shape.y, shape.width, shape.height))
      if (shape.rotation) r.rotate(shape.rotation, r.bounds.center)
      r.remove()
      return r
    }
    case 'ellipse': {
      const e = new P.Path.Ellipse({
        center: [shape.cx, shape.cy],
        radius: [shape.rx, shape.ry],
      })
      if (shape.rotation) e.rotate(shape.rotation, e.bounds.center)
      e.remove()
      return e
    }
    case 'polygon': {
      const p = new P.Path({ segments: shape.points.map((q) => [q.x, q.y]), closed: true })
      p.remove()
      return p
    }
    case 'path': {
      const c = new P.CompoundPath(shape.d)
      c.fillRule = shape.fillRule ?? 'evenodd'
      c.remove()
      return c
    }
  }
}

export function pathBounds(d: string): Rect {
  const b = toItem({ kind: 'path', d, id: '', fill: 'none', stroke: 'none', strokeWidth: 0 }).bounds
  return { x: b.x, y: b.y, width: b.width, height: b.height }
}

/** Bounds of any shape, geometry only (no stroke). */
export function shapeBounds(shape: Shape): Rect {
  const b = toItem(shape).bounds
  return { x: b.x, y: b.y, width: b.width, height: b.height }
}

/** Sum of absolute areas of all sub paths. Used by tests and for emptiness checks. */
export function shapeArea(shape: Shape): number {
  const item = toItem(shape)
  const kids = item instanceof ps().CompoundPath ? (item.children as paper.Path[]) : [item as paper.Path]
  return kids.reduce((s, p) => s + Math.abs(p.area), 0)
}

/** Applies a 2D affine matrix [a b c d e f] and returns the result as path data. */
export function transformToD(shape: Shape, m: [number, number, number, number, number, number]): string {
  const item = toItem(shape)
  item.transform(new (ps().Matrix)(m[0], m[1], m[2], m[3], m[4], m[5]))
  return itemToD(item)
}

/** Shape outline as path data (identity transform). */
export function shapeToD(shape: Shape): string {
  return itemToD(toItem(shape))
}

/**
 * Boolean operation. `lower` is the shape lower in the z-order: the result takes its
 * fill and stroke, and `subtract` means lower minus upper.
 */
export function booleanOp(op: BooleanOp, lower: Shape, upper: Shape, id: string): PathShape | null {
  const a = toItem(lower) as paper.PathItem
  const b = toItem(upper) as paper.PathItem
  const r = a[op](b, { insert: false })
  const d = itemToD(r)
  if (!d) return null
  return { kind: 'path', id, d, fill: lower.fill, stroke: lower.stroke, strokeWidth: lower.strokeWidth }
}

/** Smooths a freehand polyline into a Bezier path (closed = false). */
export function simplifyStroke(points: Point[], tolerance = 2.5): string {
  const P = ps()
  const p = new P.Path({ segments: points.map((q) => [q.x, q.y]), insert: false })
  p.simplify(tolerance)
  return itemToD(p)
}

/** True if the point hits the filled area or the stroke (tolerance in scene units). */
export function hitShape(shape: Shape, x: number, y: number, tolerance = 0): boolean {
  const item = toItem(shape)
  const pt = new (ps().Point)(x, y)
  const filled = shape.fill !== 'none' && item.contains(pt)
  if (filled) return true
  const reach = (shape.stroke === 'none' ? 0 : shape.strokeWidth / 2) + tolerance
  const paths: paper.Path[] = item instanceof ps().CompoundPath ? (item.children as paper.Path[]) : [item as paper.Path]
  return paths.some((p) => {
    const near = p.getNearestPoint(pt)
    return near ? near.getDistance(pt) <= reach : false
  })
}

/** Normalises path data to absolute M/L/C/Z commands (used for imported relative paths). */
export function absolutePathData(d: string): string {
  return itemToD(new (ps().CompoundPath)(d))
}
