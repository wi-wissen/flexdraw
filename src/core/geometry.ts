import { shapeBounds } from './paperBridge'
import type { Rect, Scene, Shape } from './types'

export const EXPORT_MARGIN = 10

/** Visual bounds of a shape including half the stroke width. */
export function visualBounds(s: Shape): Rect {
  const b = shapeBounds(s)
  const h = s.stroke === 'none' ? 0 : s.strokeWidth / 2
  return { x: b.x - h, y: b.y - h, width: b.width + 2 * h, height: b.height + 2 * h }
}

export function union(rects: Rect[]): Rect | null {
  if (!rects.length) return null
  const x1 = Math.min(...rects.map((r) => r.x))
  const y1 = Math.min(...rects.map((r) => r.y))
  const x2 = Math.max(...rects.map((r) => r.x + r.width))
  const y2 = Math.max(...rects.map((r) => r.y + r.height))
  return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 }
}

/** viewBox rectangle for export: frame of all objects plus a small margin; null if empty. */
export function exportBox(scene: Scene): Rect | null {
  const u = union(scene.shapes.map(visualBounds))
  if (!u) return null
  const m = EXPORT_MARGIN
  return { x: u.x - m, y: u.y - m, width: u.width + 2 * m, height: u.height + 2 * m }
}

export function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
}

export function containsPoint(r: Rect, x: number, y: number): boolean {
  return x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height
}
