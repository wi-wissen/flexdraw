<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import type { SvgError } from '../../core/types'
import { highlightSvg, padTrailingNewline, toDomNodes } from './highlight'

/** Debounce before `edit` is emitted, in integer milliseconds. */
const EDIT_DEBOUNCE_MS = 300
const TAB_TEXT = '  '
const ERROR_PREFIX = 'svg.error.'

// Plain textarea over a highlight.js <pre><code>. No editor library.
//   props: modelValue (string, the SVG text), error (SvgError | null)
//   emits: edit(text) – debounced 300 ms after the user stops typing (also flushed on blur);
//          never emitted for prop-driven changes of modelValue.
export default defineComponent({
  name: 'SourceEditor',
  props: {
    modelValue: { type: String, required: true },
    error: { type: Object as PropType<SvgError | null>, default: null },
    /** 1-based source lines to mark (the lines of the selected shapes). */
    highlightLines: { type: Array as PropType<number[]>, default: () => [] },
  },
  emits: ['edit', 'caret-line'],
  data() {
    return {
      localText: this.modelValue,
      /** The text of the last `edit` emission; the parent echoing it back must not overwrite typing. */
      lastEmitted: null as string | null,
      pending: false,
      timer: 0,
      focused: false,
      scrollTop: 0,
      lastCaretLine: 0,
    }
  },
  computed: {
    errorMessage(): string {
      if (!this.error) return ''
      const name = this.error.key.startsWith(ERROR_PREFIX) ? this.error.key.slice(ERROR_PREFIX.length) : this.error.key
      const path = `source.errors.${name}`
      return this.$te(path) ? this.$t(path, this.error.params ?? {}) : this.$t('source.errors.syntax')
    },
  },
  watch: {
    highlightLines(lines: number[]) {
      // A selection made in the drawing scrolls its source line into view.
      const first = lines[0]
      const ta = this.$refs.input as HTMLTextAreaElement | undefined
      if (!first || !ta || this.focused) return
      const lh = this.lineHeightPx()
      const top = (first - 1) * lh
      if (top < ta.scrollTop || top + lh * 2 > ta.scrollTop + ta.clientHeight) {
        ta.scrollTop = Math.max(0, top - ta.clientHeight / 3)
        this.syncScroll()
      }
    },
    localText() {
      this.paint()
    },
    modelValue(next: string) {
      if (next === this.localText) return
      // While typing, a parent echo of our own last edit must not replace what is being typed.
      if (this.focused && next === this.lastEmitted) return
      this.applyExternal(next)
    },
  },
  mounted() {
    this.paint()
  },
  beforeUnmount() {
    window.clearTimeout(this.timer)
  },
  methods: {
    onInput(e: Event) {
      this.localText = (e.target as HTMLTextAreaElement).value
      this.scheduleEdit()
    },
    onKeydown(e: KeyboardEvent) {
      if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        this.insertText(TAB_TEXT)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        ;(e.target as HTMLTextAreaElement).blur()
      }
    },
    lineHeightPx(): number {
      const ta = this.$refs.input as HTMLTextAreaElement | undefined
      return ta ? parseFloat(getComputedStyle(ta).lineHeight) || 20 : 20
    },
    bandStyle(line: number): Record<string, string> {
      return { top: `calc(0.75rem + ${(line - 1) * 1.5 * 0.9}rem - ${this.scrollTop}px)` }
    },
    /** Tells the parent which source line the caret is on (click or arrow keys). */
    reportCaret() {
      const ta = this.$refs.input as HTMLTextAreaElement | undefined
      if (!ta) return
      const line = ta.value.slice(0, ta.selectionStart).split('\n').length
      if (line === this.lastCaretLine) return
      this.lastCaretLine = line
      this.$emit('caret-line', line)
    },
    onFocus() {
      this.focused = true
    },
    onBlur() {
      this.focused = false
      // Do not lose text typed in the last 300 ms before the editor was left.
      if (this.pending) this.flushEdit()
    },
    onScroll() {
      this.syncScroll()
    },
    insertText(text: string) {
      const ta = this.$refs.input as HTMLTextAreaElement
      const { selectionStart: start, selectionEnd: end, value } = ta
      const next = value.slice(0, start) + text + value.slice(end)
      const caret = start + text.length
      // Set the DOM first so Vue's value patch sees no difference and keeps the caret.
      ta.value = next
      ta.setSelectionRange(caret, caret)
      this.localText = next
      this.scheduleEdit()
    },
    scheduleEdit() {
      window.clearTimeout(this.timer)
      this.pending = true
      this.timer = window.setTimeout(this.flushEdit, EDIT_DEBOUNCE_MS)
    },
    flushEdit() {
      window.clearTimeout(this.timer)
      this.timer = 0
      this.pending = false
      this.lastEmitted = this.localText
      this.$emit('edit', this.localText)
    },
    applyExternal(next: string) {
      // The parent replaced the text: a pending user edit is superseded and must not be emitted.
      window.clearTimeout(this.timer)
      this.timer = 0
      this.pending = false
      const ta = this.$refs.input as HTMLTextAreaElement | undefined
      const caret = ta ? [ta.selectionStart, ta.selectionEnd] : null
      this.localText = next
      if (ta && caret) {
        this.$nextTick(() => {
          const max = next.length
          ta.setSelectionRange(Math.min(caret[0] ?? 0, max), Math.min(caret[1] ?? 0, max))
          this.syncScroll()
        })
      }
    },
    paint() {
      const code = this.$refs.code as HTMLElement | undefined
      if (!code) return
      code.replaceChildren(...toDomNodes(highlightSvg(padTrailingNewline(this.localText))))
      this.syncScroll()
    },
    syncScroll() {
      const ta = this.$refs.input as HTMLTextAreaElement | undefined
      const layer = this.$refs.highlight as HTMLElement | undefined
      if (!ta || !layer) return
      layer.scrollTop = ta.scrollTop
      layer.scrollLeft = ta.scrollLeft
      this.scrollTop = ta.scrollTop
    },
  },
})
</script>

<template>
  <div class="sv">
    <span class="sv-label">{{ $t('source.label') }}</span>
    <div class="sv-box">
      <div v-for="line in highlightLines" :key="line" class="sv-band" data-testid="source-band" :style="bandStyle(line)" aria-hidden="true"></div>
      <pre ref="highlight" class="sv-layer sv-highlight" data-testid="source-highlight" aria-hidden="true"><code ref="code" class="hljs"></code></pre>
      <textarea
        ref="input"
        class="sv-layer sv-input"
        data-testid="source-input"
        :value="localText"
        :aria-label="$t('source.ariaLabel')"
        spellcheck="false"
        autocapitalize="off"
        autocorrect="off"
        autocomplete="off"
        wrap="off"
        @input="onInput"
        @keydown="onKeydown"
        @scroll="onScroll"
        @click="reportCaret"
        @keyup="reportCaret"
        @focus="onFocus"
        @blur="onBlur"
      ></textarea>
    </div>
    <div v-if="error" class="sv-error" role="alert" data-testid="source-error">
      <strong>{{ errorMessage }}</strong>
      <span v-if="typeof error.line === 'number'">{{ $t('source.line', { line: error.line }) }}</span>
    </div>
  </div>
</template>

<style scoped>
.sv {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 0.5rem;
  /* Highlight tokens. Light values by default, dark values under html.dark. */
  --hl-tag: #1d4ed8;
  --hl-name: #0f766e;
  --hl-attr: #b45309;
  --hl-string: #15803d;
  --hl-comment: #64748b;
  --hl-meta: #7c3aed;
  --hl-symbol: #be123c;
}
:global(.dark) .sv {
  --hl-tag: #7dd3fc;
  --hl-name: #5eead4;
  --hl-attr: #fcd34d;
  --hl-string: #86efac;
  --hl-comment: #94a3b8;
  --hl-meta: #c4b5fd;
  --hl-symbol: #fda4af;
}

.sv-label {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.sv-box {
  position: relative;
  flex: 1;
  min-height: 10rem;
  overflow: hidden;
  background: var(--panel);
  border: 2px solid var(--ink);
  box-shadow: 4px 4px 0 var(--shadow);
}
.sv-band {
  position: absolute;
  left: 0;
  right: 0;
  height: 1.35rem;
  background: rgb(46 196 182 / 0.35);
  border-left: 4px solid var(--accent);
  pointer-events: none;
}
.sv-box:focus-within {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
}

/* Both layers share every metric so glyphs land on the same pixels. */
.sv-layer {
  position: absolute;
  inset: 0;
  box-sizing: border-box;
  margin: 0;
  border: 0;
  padding: 0.75rem 1rem;
  font-family: var(--font-mono);
  font-size: 0.9rem;
  font-weight: 400;
  font-style: normal;
  line-height: 1.5;
  letter-spacing: normal;
  word-spacing: normal;
  tab-size: 2;
  white-space: pre;
  overflow-wrap: normal;
  word-break: normal;
  text-align: left;
  text-indent: 0;
  text-transform: none;
  font-variant-ligatures: none;
  font-feature-settings: normal;
}

.sv-highlight {
  overflow: hidden;
  pointer-events: none;
  color: var(--ink);
  background: transparent;
}
.sv-highlight code {
  display: block;
  font: inherit;
  color: inherit;
  white-space: pre;
}

.sv-input {
  overflow: auto;
  resize: none;
  color: transparent;
  background: transparent;
  caret-color: var(--ink);
  outline: none;
}
.sv-input::selection {
  background: rgb(46 196 182 / 0.35);
}

:deep(.hljs-tag) { color: var(--hl-tag); }
:deep(.hljs-name) { color: var(--hl-name); font-weight: 600; }
:deep(.hljs-attr) { color: var(--hl-attr); }
:deep(.hljs-string) { color: var(--hl-string); }
:deep(.hljs-comment) { color: var(--hl-comment); font-style: italic; }
:deep(.hljs-meta) { color: var(--hl-meta); }
:deep(.hljs-symbol) { color: var(--hl-symbol); }

.sv-error {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.25rem 0.75rem;
  padding: 0.5rem 0.75rem;
  color: #0f172a;
  background: var(--danger);
  border: 2px solid #0f172a;
}
</style>
