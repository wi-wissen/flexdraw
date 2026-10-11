// Writes the scene as readable SVG: one element per line, indented, hex colours only,
// numbers rounded to 2 decimals, no editor ids. Circle/ellipse/rect/polygon stay semantic;
// only freehand and boolean results are <path>.
import { exportBox } from './geometry'
import { num, roundPathData } from './numfmt'
import type { Scene, Shape } from './types'

function paintAttrs(s: Shape): string {
  let out = ` fill="${s.fill}"`
  if (s.stroke !== 'none') out += ` stroke="${s.stroke}" stroke-width="${num(s.strokeWidth)}"`
  return out
}

function rotation(deg: number, cx: number, cy: number): string {
  return deg ? ` transform="rotate(${num(deg)} ${num(cx)} ${num(cy)})"` : ''
}

export function shapeToSvg(s: Shape): string {
  switch (s.kind) {
    case 'rect':
      return `<rect x="${num(s.x)}" y="${num(s.y)}" width="${num(s.width)}" height="${num(s.height)}"${paintAttrs(s)}${rotation(s.rotation, s.x + s.width / 2, s.y + s.height / 2)} />`
    case 'ellipse': {
      const tr = rotation(s.rotation, s.cx, s.cy)
      if (s.rx === s.ry) return `<circle cx="${num(s.cx)}" cy="${num(s.cy)}" r="${num(s.rx)}"${paintAttrs(s)} />`
      return `<ellipse cx="${num(s.cx)}" cy="${num(s.cy)}" rx="${num(s.rx)}" ry="${num(s.ry)}"${paintAttrs(s)}${tr} />`
    }
    case 'polygon':
      return `<polygon points="${s.points.map((p) => `${num(p.x)},${num(p.y)}`).join(' ')}"${paintAttrs(s)} />`
    case 'path':
      return `<path d="${roundPathData(s.d)}"${paintAttrs(s)}${s.fillRule === 'nonzero' ? '' : ' fill-rule="evenodd"'} />`
  }
}

export function sceneToSvg(scene: Scene): string {
  const box = exportBox(scene)
  if (!box) return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">\n</svg>\n'
  const vb = `${num(box.x)} ${num(box.y)} ${num(box.width)} ${num(box.height)}`
  const lines = scene.shapes.map((s) => '  ' + shapeToSvg(s))
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${num(box.width)}" height="${num(box.height)}">\n${lines.join('\n')}\n</svg>\n`
}
