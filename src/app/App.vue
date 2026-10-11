<script lang="ts">
import { defineComponent, markRaw, nextTick } from 'vue'
import { Editor, type Origin } from '../core/editor'
import { smileyScene } from '../core/templates'
import type { SvgError } from '../core/types'
import AppHeader from '../shared/components/AppHeader.vue'
import Icon from '../shared/components/Icon.vue'
import { STORAGE } from '../shared/config'
import ActionBar from './components/ActionBar.vue'
import PropertiesPanel from './components/PropertiesPanel.vue'
import SourceEditor from './components/SourceEditor.vue'
import StartCard from './components/StartCard.vue'
import ToolPalette from './components/ToolPalette.vue'
import CanvasView from './CanvasView.vue'

type View = 'draw' | 'split' | 'code'
const VIEWS: View[] = ['draw', 'split', 'code']
const VIEW_ICONS: Record<View, string> = { draw: 'view-draw', split: 'view-split', code: 'view-code' }
const SAVE_DELAY_MS = 500
const SOURCE_DELAY_MS = 300

export default defineComponent({
  name: 'App',
  components: { AppHeader, Icon, ActionBar, PropertiesPanel, SourceEditor, StartCard, ToolPalette, CanvasView },
  data() {
    return {
      editor: markRaw(new Editor()),
      rev: 0,
      view: 'draw' as View, // always starts as "Zeichnung"; the choice is not stored
      views: VIEWS,
      viewIcons: VIEW_ICONS,
      tool: 'select',
      zoomPct: 100,
      sourceText: '',
      sourceError: null as SvgError | null,
      warnings: [] as string[],
      openError: '',
      startDismissed: false,
      splitPct: 50,
      narrow: false,
      saveTimer: 0,
      sourceDelay: SOURCE_DELAY_MS,
    }
  },
  computed: {
    showStart(): boolean {
      void this.rev
      return !this.startDismissed && this.editor.isEmpty
    },
    canUndo(): boolean {
      void this.rev
      return this.editor.canUndo
    },
    canRedo(): boolean {
      void this.rev
      return this.editor.canRedo
    },
    canExport(): boolean {
      void this.rev
      return this.editor.canExport
    },
    highlightLines(): number[] {
      void this.rev
      return this.editor.selection.map((id) => this.editor.lineOfShape(id)).filter((l): l is number => l !== null)
    },
    showCanvas(): boolean {
      return this.view !== 'code'
    },
    showSource(): boolean {
      return this.view !== 'draw'
    },
  },
  watch: {
    view() {
      // The canvas size changes with the view; re-centre the drawing in the new area.
      nextTick(() => this.canvas()?.showAll())
    },
  },
  mounted() {
    this.editor.onChange(this.onEditorChange)
    const mq = window.matchMedia('(max-width: 800px)')
    this.narrow = mq.matches
    mq.addEventListener('change', (e) => (this.narrow = e.matches))
    try {
      const saved = localStorage.getItem(STORAGE.drawing)
      if (saved) this.editor.loadSvg(saved)
    } catch {
      /* storage unavailable: start empty */
    }
    this.sourceText = this.editor.svg
    this.rev++
    window.addEventListener('keydown', this.onKey)
    nextTick(() => this.canvas()?.showAll())
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.onKey)
  },
  methods: {
    canvas() {
      return this.$refs.canvas as InstanceType<typeof CanvasView> | undefined
    },
    onEditorChange(origin: Origin) {
      this.rev++
      if (origin === 'selection') return // selecting never rewrites the source or the saved drawing
      if (origin === 'scene') {
        this.sourceText = this.editor.svg
        this.sourceError = null
      }
      window.clearTimeout(this.saveTimer)
      this.saveTimer = window.setTimeout(this.save, SAVE_DELAY_MS)
    },
    save() {
      try {
        if (this.editor.isEmpty) localStorage.removeItem(STORAGE.drawing)
        else localStorage.setItem(STORAGE.drawing, this.editor.svg)
      } catch {
        /* storage full or blocked */
      }
    },
    /** Clicking a source line selects the shape that line describes. */
    onCaretLine(line: number) {
      const id = this.editor.shapeAtLine(line)
      if (id && !(this.editor.selection.length === 1 && this.editor.selection[0] === id)) this.editor.select([id])
    },
    onSourceEdit(text: string) {
      this.sourceText = text
      const r = this.editor.applySource(text)
      if (r.ok) {
        this.sourceError = null
        this.warnings = r.warnings
      } else this.sourceError = r.error
    },

    // ---- actions ----
    newDrawing() {
      if (!this.editor.isEmpty && !window.confirm(this.$t('app.actions.confirmNew'))) return
      this.editor.newDocument()
      this.startDismissed = false
      this.warnings = []
      this.canvas()?.showAll()
    },
    openFile() {
      ;(this.$refs.file as HTMLInputElement).click()
    },
    async onFile(e: Event) {
      const input = e.target as HTMLInputElement
      const file = input.files?.[0]
      input.value = ''
      if (!file) return
      const r = this.editor.loadSvg(await file.text())
      if (r.ok) {
        this.warnings = r.warnings
        this.openError = ''
        this.sourceText = this.editor.svg
        await nextTick()
        this.canvas()?.showAll()
      } else {
        this.openError = this.$t('app.openError', { message: this.errorText(r.error) })
      }
    },
    loadSmiley() {
      this.editor.loadScene(smileyScene())
      this.warnings = []
      nextTick(() => this.canvas()?.showAll())
    },
    download() {
      if (!this.editor.canExport) return
      const url = URL.createObjectURL(new Blob([this.editor.svg], { type: 'image/svg+xml' }))
      const a = document.createElement('a')
      a.href = url
      a.download = 'drawing.svg'
      a.click()
      URL.revokeObjectURL(url)
    },
    errorText(err: SvgError): string {
      return this.$t('source.errors.' + err.key.replace('svg.error.', ''), err.params ?? {}) + (err.line ? ` (${this.$t('source.line', { line: err.line })})` : '')
    },

    // ---- keyboard ----
    onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return
      const mod = e.ctrlKey || e.metaKey
      const k = e.key.toLowerCase()
      const ed = this.editor
      let handled = true
      if (mod && k === 'z') {
        if (e.shiftKey) ed.redo()
        else ed.undo()
      }
      else if (mod && k === 'y') ed.redo()
      else if (mod && k === 'c') ed.copy()
      else if (mod && k === 'v') ed.paste()
      else if (mod && k === 'd') ed.duplicate()
      else if (mod && k === 'a') ed.selectAll()
      else if (mod && k === 's') this.download()
      else if (k === 'escape') ed.clearSelection()
      else if ((k === 'delete' || k === 'backspace') && ed.selection.length) ed.deleteSelection()
      else if (k.startsWith('arrow') && ed.selection.length) {
        const step = e.shiftKey ? 10 : 1
        ed.move(k === 'arrowleft' ? -step : k === 'arrowright' ? step : 0, k === 'arrowup' ? -step : k === 'arrowdown' ? step : 0)
      } else handled = false
      if (handled) e.preventDefault()
    },

    // ---- splitter ----
    startSplit(e: PointerEvent) {
      const area = (this.$refs.area as HTMLElement).getBoundingClientRect()
      const move = (ev: PointerEvent) => {
        const pct = this.narrow ? ((ev.clientY - area.top) / area.height) * 100 : ((ev.clientX - area.left) / area.width) * 100
        this.splitPct = Math.min(80, Math.max(20, pct))
      }
      const up = () => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', up)
      }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
      e.preventDefault()
    },
    onSplitKey(e: KeyboardEvent) {
      const back = this.narrow ? 'ArrowUp' : 'ArrowLeft'
      const fwd = this.narrow ? 'ArrowDown' : 'ArrowRight'
      if (e.key === back) this.splitPct = Math.max(20, this.splitPct - 5)
      else if (e.key === fwd) this.splitPct = Math.min(80, this.splitPct + 5)
      else return
      e.preventDefault()
    },
  },
})
</script>

<template>
  <div class="flex h-screen flex-col">
    <AppHeader current="app">
      <div class="flex" role="group" :aria-label="$t('app.views.label')">
        <button
          v-for="v in views" :key="v" type="button" class="nb-btn -ml-0.5" :class="{ 'is-active': view === v }" :data-testid="`view-${v}`"
          :aria-pressed="view === v" :title="$t('app.views.' + v + 'Tip')" @click="view = v"
        ><Icon :name="viewIcons[v]" />{{ $t('app.views.' + v) }}</button>
      </div>
    </AppHeader>

    <ActionBar :can-undo="canUndo" :can-redo="canRedo" :can-export="canExport" @new="newDrawing" @open="openFile" @download="download" @undo="editor.undo()" @redo="editor.redo()" />
    <input ref="file" type="file" accept=".svg,image/svg+xml" class="sr-only" tabindex="-1" aria-hidden="true" data-testid="file-input" @change="onFile" />

    <div v-if="warnings.length || openError" class="flex items-start justify-between gap-3 border-b-2 border-ink bg-primary px-4 py-2 text-[#0f172a]" role="status" data-testid="notice">
      <div>
        <strong v-if="warnings.length">{{ $t('app.warn.title') }}: </strong>
        <span v-for="w in warnings" :key="w" class="mr-2">{{ $t('app.warn.' + w.replace('svg.warn.', '')) }}</span>
        <span v-if="openError">{{ openError }}</span>
      </div>
      <button type="button" class="nb-btn" @click="warnings = []; openError = ''"><Icon name="close" />{{ $t('app.warn.dismiss') }}</button>
    </div>

    <div class="flex min-h-0 flex-1">
      <ToolPalette v-model:tool="tool" />
      <div ref="area" class="flex min-w-0 flex-1" :class="narrow ? 'flex-col' : 'flex-row'">
        <div v-show="showCanvas" class="relative min-h-0 min-w-0" :style="view === 'split' ? { flex: `0 0 ${splitPct}%` } : { flex: '1 1 0' }">
          <CanvasView ref="canvas" :editor="editor" :rev="rev" :tool="tool" @zoom="zoomPct = $event" />
          <StartCard v-if="showStart" @empty="startDismissed = true" @smiley="loadSmiley" @open="openFile" @close="startDismissed = true" />
          <div class="absolute bottom-3 left-3 flex gap-2" role="group" :aria-label="$t('app.zoom.level', { percent: zoomPct })">
            <button type="button" class="nb-btn" data-testid="zoom-out" :title="$t('app.zoom.out')" @click="canvas()?.zoomBy(1 / 1.25)"><Icon name="minus" />{{ $t('app.zoom.out') }}</button>
            <button type="button" class="nb-btn" data-testid="zoom-reset" :title="$t('app.zoom.resetTip')" @click="canvas()?.resetZoom()"><Icon name="fit" /><span data-testid="zoom-level">{{ zoomPct }} %</span></button>
            <button type="button" class="nb-btn" data-testid="zoom-in" :title="$t('app.zoom.in')" @click="canvas()?.zoomBy(1.25)"><Icon name="plus" />{{ $t('app.zoom.in') }}</button>
          </div>
        </div>
        <div
          v-if="view === 'split'" class="split-handle" :class="narrow ? 'is-h' : 'is-v'" role="separator" tabindex="0" data-testid="splitter"
          :aria-orientation="narrow ? 'horizontal' : 'vertical'" :aria-label="$t('app.split.handle')" :aria-valuenow="Math.round(splitPct)" aria-valuemin="20" aria-valuemax="80"
          :title="$t('app.split.hint')" @pointerdown="startSplit" @keydown="onSplitKey"
        />
        <div v-show="showSource" class="min-h-0 min-w-0 flex-1 p-3" data-testid="source-pane">
          <SourceEditor :model-value="sourceText" :error="sourceError" :highlight-lines="highlightLines" @edit="onSourceEdit" @caret-line="onCaretLine" />
        </div>
      </div>
      <PropertiesPanel :editor="editor" :rev="rev" />
    </div>

    <footer class="border-t-2 border-ink bg-panel px-4 py-2" data-testid="hint" aria-live="polite">{{ $t('app.hint.' + tool) }}</footer>
  </div>
</template>

<style scoped>
.split-handle { flex: none; background: var(--ink); touch-action: none; }
.split-handle.is-v { width: 8px; cursor: col-resize; }
.split-handle.is-h { height: 8px; cursor: row-resize; }
.split-handle:hover, .split-handle:focus-visible { background: var(--accent); }
</style>
