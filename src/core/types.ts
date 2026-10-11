// Scene model: the single source of truth. Pure data, no DOM, no Paper.js objects.
// All durations/timestamps in this code base are integer milliseconds.

/** A paint is a lowercase 6-digit hex string such as "#ffc93c", or "none". */
export type Paint = string

export interface Style {
  fill: Paint
  stroke: Paint
  strokeWidth: number
}

export interface Point {
  x: number
  y: number
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

interface Base extends Style {
  /** Editor-internal id. Never written to SVG. */
  id: string
}

export interface RectShape extends Base {
  kind: 'rect'
  x: number
  y: number
  width: number
  height: number
  /** Degrees around the centre. */
  rotation: number
}

export interface EllipseShape extends Base {
  kind: 'ellipse'
  cx: number
  cy: number
  rx: number
  ry: number
  rotation: number
}

export interface PolygonShape extends Base {
  kind: 'polygon'
  points: Point[]
}

export interface PathShape extends Base {
  kind: 'path'
  /** SVG path data, absolute commands, numbers rounded to 2 decimals. */
  d: string
  /** SVG default is "nonzero". Shapes made by the editor (booleans) use "evenodd". */
  fillRule?: 'nonzero' | 'evenodd'
}

export type Shape = RectShape | EllipseShape | PolygonShape | PathShape

export interface Scene {
  /** Index 0 is the back, last is the front. */
  shapes: Shape[]
}

export type BooleanOp = 'unite' | 'intersect' | 'subtract' | 'exclude'
export type Reorder = 'front' | 'forward' | 'backward' | 'back'

/** Error with i18n key (resolved by UI) and the 1-based source line when known. */
export interface SvgError {
  key: string
  line?: number
  params?: Record<string, string | number>
}

export interface ImportResult {
  scene: Scene
  /** i18n keys of unsupported parts that were ignored (gradients, filters, text ...). */
  warnings: string[]
  /** 1-based source line of each shape element, aligned with scene.shapes. */
  lines: number[]
}
