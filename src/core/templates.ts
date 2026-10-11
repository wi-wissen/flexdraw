import type { Scene } from './types'

const INK = '#0f172a'

/** Smiley for task 1: face (circle), two eyes (ellipses), mouth (half ellipse as path). */
export function smileyScene(): Scene {
  return {
    shapes: [
      { kind: 'ellipse', id: 'face', cx: 60, cy: 60, rx: 50, ry: 50, rotation: 0, fill: '#ffc93c', stroke: INK, strokeWidth: 4 },
      { kind: 'ellipse', id: 'eye-left', cx: 42, cy: 46, rx: 6, ry: 10, rotation: 0, fill: INK, stroke: 'none', strokeWidth: 0 },
      { kind: 'ellipse', id: 'eye-right', cx: 78, cy: 46, rx: 6, ry: 10, rotation: 0, fill: INK, stroke: 'none', strokeWidth: 0 },
      { kind: 'path', id: 'mouth', d: 'M 32 68 A 28 22 0 0 0 88 68 Z', fill: '#ff6b6b', stroke: INK, strokeWidth: 3 },
    ],
  }
}
