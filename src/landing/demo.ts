// Data and timeline of the landing page demo: a smiley is drawn shape by shape while the
// matching SVG source is typed line by line. Pure TypeScript, no DOM.
// The source text is code, not UI text, so it is not translated.

export const BRAND = ['#ffc93c', '#2ec4b6', '#ff6b6b'] as const
export const INK = '#0f172a'

export type ShapeTag = 'rect' | 'circle' | 'ellipse' | 'path' | 'polygon'
export type Attr = [name: string, value: string]
export type DemoShape = { key: string; tag: ShapeTag; attrs: Attr[] }

/** One coloured piece of a code line. `swatch` tokens have no text and show a colour chip. */
export type Token = { c: 'ws' | 'punct' | 'tag' | 'attr' | 'str' | 'swatch'; v: string; color?: string }
export type DemoLine = { tokens: Token[]; len: number; shape: number | null }

// Integer milliseconds only (CLAUDE.md).
export const CHAR_MS = 26
export const CHARS_PER_TICK = 2
export const LINE_PAUSE_MS = 460
export const HOLD_MS = 3200
export const START_MS = 500

function starPoints(cx: number, cy: number, outer: number, inner: number): string {
  const pts: string[] = []
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    pts.push(`${Math.round(cx + r * Math.cos(a))},${Math.round(cy + r * Math.sin(a))}`)
  }
  return pts.join(' ')
}

const STAR = starPoints(42, 46, 30, 13)

/** The drawing for colour cycle `k`: fills rotate through the brand palette on every loop. */
export function demoShapes(k: number): DemoShape[] {
  const c = (n: number) => BRAND[(k + n) % BRAND.length]!
  return [
    { key: 'box', tag: 'rect', attrs: [['x', '14'], ['y', '126'], ['width', '62'], ['height', '58'], ['fill', c(1)], ['stroke', INK], ['stroke-width', '4']] },
    { key: 'face', tag: 'circle', attrs: [['cx', '138'], ['cy', '90'], ['r', '60'], ['fill', c(0)], ['stroke', INK], ['stroke-width', '4']] },
    { key: 'eyeL', tag: 'ellipse', attrs: [['cx', '118'], ['cy', '74'], ['rx', '7'], ['ry', '11'], ['fill', INK]] },
    { key: 'eyeR', tag: 'ellipse', attrs: [['cx', '158'], ['cy', '74'], ['rx', '7'], ['ry', '11'], ['fill', INK]] },
    { key: 'mouth', tag: 'path', attrs: [['d', 'M 106 104 A 32 26 0 0 0 170 104 Z'], ['fill', c(2)], ['stroke', INK], ['stroke-width', '3']] },
    { key: 'star', tag: 'polygon', attrs: [['points', STAR], ['fill', c(2)], ['stroke', INK], ['stroke-width', '3']] },
    { key: 'squiggle', tag: 'path', attrs: [['d', 'M 112 178 C 132 154, 148 202, 168 178 S 206 154, 226 178'], ['fill', 'none'], ['stroke', c(1)], ['stroke-width', '7']] },
  ]
}

const isHex = (v: string) => /^#[0-9a-f]{6}$/i.test(v)

function attrTokens(attrs: Attr[]): Token[] {
  const out: Token[] = []
  for (const [name, value] of attrs) {
    out.push({ c: 'ws', v: ' ' }, { c: 'attr', v: name }, { c: 'punct', v: '=' }, { c: 'str', v: `"${value}"` })
    if (isHex(value)) out.push({ c: 'swatch', v: '', color: value })
  }
  return out
}

const lineOf = (tokens: Token[], shape: number | null): DemoLine => ({
  tokens,
  shape,
  len: tokens.reduce((n, t) => n + t.v.length, 0),
})

/** All code lines for cycle `k`: opening tag, one line per shape, closing tag. */
export function demoLines(k: number): DemoLine[] {
  const open = lineOf(
    [
      { c: 'punct', v: '<' },
      { c: 'tag', v: 'svg' },
      ...attrTokens([['xmlns', 'http://www.w3.org/2000/svg'], ['viewBox', '0 0 240 200']]),
      { c: 'punct', v: '>' },
    ],
    null,
  )
  const body = demoShapes(k).map((s, i) =>
    lineOf([{ c: 'ws', v: '  ' }, { c: 'punct', v: '<' }, { c: 'tag', v: s.tag }, ...attrTokens(s.attrs), { c: 'punct', v: ' />' }], i),
  )
  const close = lineOf([{ c: 'punct', v: '</' }, { c: 'tag', v: 'svg' }, { c: 'punct', v: '>' }], null)
  return [open, ...body, close]
}

/** Cumulative end offset (in characters) of every line. */
export function lineEnds(lines: DemoLine[]): number[] {
  let acc = 0
  return lines.map((l) => (acc += l.len))
}

/** Next typed-character count and the delay before the following tick. */
export function nextTick(typed: number, ends: number[]): { typed: number; delay: number } {
  const total = ends[ends.length - 1] ?? 0
  const end = ends.find((e) => e > typed) ?? total
  const next = Math.min(typed + CHARS_PER_TICK, end)
  const delay = next >= total ? HOLD_MS : next === end ? LINE_PAUSE_MS : CHAR_MS
  return { typed: next, delay }
}

/** Milliseconds from start until every line is typed (used by tests). */
export function msUntilComplete(lines: DemoLine[]): number {
  const ends = lineEnds(lines)
  const total = ends[ends.length - 1] ?? 0
  let typed = 0
  let ms = START_MS
  while (typed < total) {
    const step = nextTick(typed, ends)
    typed = step.typed
    if (typed < total) ms += step.delay
  }
  return ms
}

/** Visible tokens of a line when `shown` of its characters are typed. */
export function sliceTokens(tokens: Token[], shown: number): Token[] {
  const out: Token[] = []
  let left = shown
  let prevFull = false
  for (const t of tokens) {
    if (t.c === 'swatch') {
      // The chip appears as soon as the colour value before it is complete.
      if (prevFull) out.push(t)
      continue
    }
    if (left <= 0) break
    if (t.v.length <= left) {
      out.push(t)
      left -= t.v.length
      prevFull = true
    } else {
      out.push({ ...t, v: t.v.slice(0, left) })
      left = 0
      prevFull = false
    }
  }
  return out
}
