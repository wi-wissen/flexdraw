// Dev harness for SourceEditor. Not part of the product build.
import { defineComponent, h } from 'vue'
import SourceEditor from '../../src/app/components/SourceEditor.vue'
import { mountPage } from '../../src/shared/mount'
import type { SvgError } from '../../src/core/types'

const SAMPLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <!-- a sample drawing -->
  <rect x="10" y="10" width="100" height="100" fill="#ffc93c" stroke="#0f172a" stroke-width="2"/>
  <circle cx="60" cy="60" r="30" fill="#2ec4b6"/>
</svg>
`

const ERROR: SvgError = { key: 'svg.error.mismatchedTag', line: 3, params: { tag: 'g' } }

// Harness buttons use plain text on purpose: this page is a dev fixture, not product UI.
const Harness = defineComponent({
  name: 'SourceEditorHarness',
  data() {
    return {
      text: SAMPLE,
      error: null as SvgError | null,
      log: [] as string[],
      externalCount: 0,
    }
  },
  methods: {
    onEdit(text: string) {
      this.log.push(`edit: ${JSON.stringify(text.slice(0, 60))} (${text.length})`)
    },
    changeExternally() {
      this.externalCount += 1
      this.text = `<svg viewBox="0 0 10 10"><path d="M0 0L10 10" data-external="${this.externalCount}"/></svg>\n`
      this.log.push(`external: ${this.externalCount}`)
    },
    toggleError() {
      this.error = this.error ? null : ERROR
    },
    loadLong() {
      const lines = Array.from({ length: 120 }, (_, i) => `  <rect x="${i}" y="${i}" width="${i * 10 + 200}" height="4" fill="#ffc93c"/>`)
      this.text = `<svg xmlns="http://www.w3.org/2000/svg">\n${lines.join('\n')}\n</svg>\n`
    },
  },
  render() {
    return h('main', { style: 'padding: 1.5rem; max-width: 52rem; display: flex; flex-direction: column; gap: 1rem;' }, [
      h('div', { style: 'display: flex; gap: 0.5rem; flex-wrap: wrap;' }, [
        h('button', { class: 'nb-btn', id: 'external', type: 'button', onClick: this.changeExternally }, 'Extern ändern'),
        h('button', { class: 'nb-btn', id: 'error', type: 'button', onClick: this.toggleError }, 'Fehler ein/aus'),
        h('button', { class: 'nb-btn', id: 'long', type: 'button', onClick: this.loadLong }, 'Langer Text'),
      ]),
      h(SourceEditor, {
        modelValue: this.text,
        error: this.error,
        onEdit: this.onEdit,
      }),
      h('pre', { id: 'log', style: 'font-size: 0.8rem; margin: 0; white-space: pre-wrap;' }, this.log.join('\n')),
    ])
  },
})

mountPage(Harness)
