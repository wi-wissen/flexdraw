// Tiny XML reader (no DOMParser, so the core stays DOM-free and testable in Node).
// Supports elements, attributes, comments, CDATA, doctype and processing instructions.

import type { SvgError } from './types'

export interface XmlNode {
  name: string
  attrs: Record<string, string>
  children: XmlNode[]
  /** 1-based line of the opening tag. */
  line: number
}

export class XmlError extends Error {
  constructor(public info: SvgError) {
    super(info.key)
  }
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }

function decode(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : m
    }
    return ENTITIES[e.toLowerCase()] ?? m
  })
}

export function parseXml(src: string): XmlNode {
  let i = 0
  let line = 1
  const root: XmlNode = { name: '#root', attrs: {}, children: [], line: 1 }
  const stack: XmlNode[] = [root]

  const fail = (key: string, params?: Record<string, string | number>): never => {
    throw new XmlError({ key, line, params })
  }
  const advance = (to: number) => {
    for (let k = i; k < to; k++) if (src[k] === '\n') line++
    i = to
  }
  const skipUntil = (end: string, key: string) => {
    const at = src.indexOf(end, i)
    if (at < 0) fail(key)
    advance(at + end.length)
  }

  while (i < src.length) {
    const lt = src.indexOf('<', i)
    if (lt < 0) break
    advance(lt)
    if (src.startsWith('<!--', i)) skipUntil('-->', 'svg.error.unclosedComment')
    else if (src.startsWith('<![CDATA[', i)) skipUntil(']]>', 'svg.error.syntax')
    else if (src.startsWith('<?', i)) skipUntil('?>', 'svg.error.syntax')
    else if (src.startsWith('<!', i)) skipUntil('>', 'svg.error.syntax')
    else if (src.startsWith('</', i)) {
      const m = /^<\/([^\s>]+)\s*>/.exec(src.slice(i, i + 200))
      if (!m) return fail('svg.error.syntax')
      const open = stack.pop()
      if (!open || open === root || open.name !== m[1]) {
        fail('svg.error.mismatchedTag', { tag: m[1]! })
      }
      advance(i + m[0].length)
    } else {
      const startLine = line
      const nm = /^<([A-Za-z_][\w:.-]*)/.exec(src.slice(i, i + 200))
      if (!nm) return fail('svg.error.syntax')
      const node: XmlNode = { name: nm[1]!, attrs: {}, children: [], line: startLine }
      advance(i + nm[0].length)
      for (;;) {
        const ws = /^\s+/.exec(src.slice(i, i + 200))
        if (ws) advance(i + ws[0].length)
        if (i >= src.length) return fail('svg.error.unclosedTag', { tag: node.name })
        if (src.startsWith('/>', i)) {
          advance(i + 2)
          stack[stack.length - 1]!.children.push(node)
          break
        }
        if (src[i] === '>') {
          advance(i + 1)
          stack[stack.length - 1]!.children.push(node)
          stack.push(node)
          break
        }
        const am = /^([A-Za-z_:][\w:.-]*)\s*=\s*("([^"]*)"|'([^']*)')/.exec(src.slice(i))
        if (!am) return fail('svg.error.badAttribute', { tag: node.name })
        node.attrs[am[1]!] = decode(am[3] ?? am[4] ?? '')
        advance(i + am[0].length)
      }
    }
  }
  if (stack.length > 1) {
    const open = stack[stack.length - 1]!
    throw new XmlError({ key: 'svg.error.unclosedTag', line: open.line, params: { tag: open.name } })
  }
  const first = root.children[0]
  if (!first) throw new XmlError({ key: 'svg.error.empty', line: 1 })
  return first
}
