import hljs from 'highlight.js/lib/core'
import xml from 'highlight.js/lib/languages/xml'

hljs.registerLanguage('xml', xml)

/** highlight.js escapes its input; the markup it returns contains only text and <span> tags. */
export function highlightSvg(text: string): string {
  return hljs.highlight(text, { language: 'xml', ignoreIllegals: true }).value
}

/** A textarea shows a trailing newline as an empty last line, a <pre> does not. Pad it with a space. */
export function padTrailingNewline(text: string): string {
  return text.endsWith('\n') ? `${text} ` : text
}

const HLJS_CLASS = /^hljs(-[\w]+)?$/

/**
 * Turns highlight.js output into DOM nodes without v-html. Only <span> elements with
 * hljs classes survive; any other element is flattened to its text.
 */
export function toDomNodes(html: string): Node[] {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const walk = (src: Node): Node[] => {
    const out: Node[] = []
    src.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        out.push(document.createTextNode(child.textContent ?? ''))
      } else if (child instanceof HTMLSpanElement) {
        const span = document.createElement('span')
        const cls = (child.getAttribute('class') ?? '').split(/\s+/).filter((c) => HLJS_CLASS.test(c))
        if (cls.length) span.className = cls.join(' ')
        span.append(...walk(child))
        out.push(span)
      } else {
        out.push(...walk(child))
      }
    })
    return out
  }
  return walk(doc.body)
}
