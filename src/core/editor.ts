// Editor state machine: scene + selection + history + clipboard. No DOM, no Vue.
// The UI holds one instance (markRaw) and re-reads state after every 'change' event.
import { exportBox } from './geometry'
import { History } from './history'
import { booleanOp } from './paperBridge'
import {
  DEFAULT_STYLE, addShape, duplicateShapes, emptyScene, newId, removeShapes, reorder, rotateShape,
  scaleShape, selectionBounds, translateShapes, updateShapes,
} from './scene'
import { importSvg } from './svgRead'
import { sceneToSvg } from './svgWrite'
import type { BooleanOp, Reorder, Scene, Shape, Style, SvgError } from './types'
import { XmlError } from './xml'

/** Where a change came from. Changes from 'source' must not be written back to the source. */
export type Origin = 'scene' | 'source' | 'selection'
export type ChangeListener = (origin: Origin) => void

export type SourceResult = { ok: true; warnings: string[] } | { ok: false; error: SvgError }

export class Editor {
  scene: Scene
  selection: string[] = []
  defaultStyle: Style = { ...DEFAULT_STYLE }
  private history: History
  private clipboard: Shape[] = []
  private listeners = new Set<ChangeListener>()
  /** Selection before each undoable step, so undo/redo bring the selection back. */
  private undoSel: string[][] = []
  private redoSel: string[][] = []
  /** Source lines of the shapes after a source edit; null when the text is regenerated. */
  private sourceLines: number[] | null = null

  constructor(scene: Scene = emptyScene()) {
    this.scene = scene
    this.history = new History(scene)
  }

  onChange(fn: ChangeListener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }
  private emit(origin: Origin = 'scene') {
    if (origin === 'scene') this.sourceLines = null
    this.listeners.forEach((l) => l(origin))
  }

  // ---- derived state ----
  get svg(): string {
    return sceneToSvg(this.scene)
  }
  get canExport(): boolean {
    return this.scene.shapes.length > 0
  }
  get canUndo(): boolean {
    return this.history.canUndo
  }
  get canRedo(): boolean {
    return this.history.canRedo
  }
  get selectedShapes(): Shape[] {
    return this.scene.shapes.filter((s) => this.selection.includes(s.id))
  }
  get canBoolean(): boolean {
    return this.selection.length === 2
  }
  get isEmpty(): boolean {
    return this.scene.shapes.length === 0
  }
  get viewBox() {
    return exportBox(this.scene)
  }

  // ---- gesture API: preview while dragging, commit on release ----
  preview(next: Scene) {
    this.scene = next
    this.emit()
  }
  commit(next: Scene) {
    this.record(next)
    this.emit()
  }
  /** Pushes to history and remembers the selection from before the step. */
  private record(next: Scene) {
    const before = this.history.current
    const sel = [...this.selection]
    this.scene = this.history.push(next)
    if (this.history.current !== before) {
      this.undoSel.push(sel)
      if (this.undoSel.length > 100) this.undoSel.shift()
      this.redoSel = []
    }
  }
  private resetSelectionHistory() {
    this.undoSel = []
    this.redoSel = []
  }
  /** 1-based source line of a shape in the current source text. */
  lineOfShape(id: string): number | null {
    const i = this.scene.shapes.findIndex((s) => s.id === id)
    if (i < 0) return null
    return this.sourceLines ? (this.sourceLines[i] ?? null) : i + 2
  }
  /** The shape (id) that owns a source line, or null. */
  shapeAtLine(line: number): string | null {
    const shapes = this.scene.shapes
    for (let i = 0; i < shapes.length; i++) {
      const start = this.sourceLines ? this.sourceLines[i] : i + 2
      if (start === undefined) continue
      const nextStart = this.sourceLines ? this.sourceLines[i + 1] : i + 3
      const end = nextStart === undefined ? start : this.sourceLines ? nextStart - 1 : start
      if (line >= start && line <= end) return shapes[i]!.id
    }
    return null
  }

  /** Drop an uncommitted preview. */
  cancelPreview() {
    this.scene = this.history.current
    this.emit()
  }

  // ---- selection ----
  select(ids: string[]) {
    this.selection = ids.filter((id) => this.scene.shapes.some((s) => s.id === id))
    this.emit('selection')
  }
  selectAll() {
    this.select(this.scene.shapes.map((s) => s.id))
  }
  clearSelection() {
    this.select([])
  }

  // ---- editing ----
  add(shape: Shape) {
    this.record(addShape(this.scene, shape))
    this.selection = [shape.id]
    this.emit()
  }
  deleteSelection() {
    if (!this.selection.length) return
    this.record(removeShapes(this.scene, this.selection))
    this.selection = []
    this.emit()
  }
  move(dx: number, dy: number) {
    if (this.selection.length) this.commit(translateShapes(this.scene, this.selection, dx, dy))
  }
  rotateSelection(deg: number) {
    const b = selectionBounds(this.scene, this.selection)
    if (!b) return
    const pivot = { x: b.x + b.width / 2, y: b.y + b.height / 2 }
    this.commit({ shapes: this.scene.shapes.map((s) => (this.selection.includes(s.id) ? rotateShape(s, deg, pivot) : s)) })
  }
  scaleSelection(sx: number, sy: number, origin: { x: number; y: number }) {
    this.commit({ shapes: this.scene.shapes.map((s) => (this.selection.includes(s.id) ? scaleShape(s, sx, sy, origin) : s)) })
  }
  duplicate() {
    if (!this.selection.length) return
    const r = duplicateShapes(this.scene, this.selection)
    this.record(r.scene)
    this.selection = r.ids
    this.emit()
  }
  copy() {
    this.clipboard = this.selectedShapes
  }
  paste() {
    if (!this.clipboard.length) return
    const copies = this.clipboard.map((s) => ({ ...s, id: newId() }) as Shape)
    this.record({ shapes: [...this.scene.shapes, ...copies] })
    this.selection = copies.map((c) => c.id)
    this.emit()
    // next paste lands a bit further down-right
    this.clipboard = this.clipboard.map((s) => ({ ...s }))
  }
  reorder(mode: Reorder) {
    if (this.selection.length) this.commit(reorder(this.scene, this.selection, mode))
  }

  /** Sets fill/stroke/width on the selection, or on the default style when nothing is selected. */
  setStyle(patch: Partial<Style>) {
    if (this.selection.length) this.commit(updateShapes(this.scene, this.selection, patch))
    else {
      this.defaultStyle = { ...this.defaultStyle, ...patch }
      this.emit()
    }
  }
  /** The style shown in the properties panel: of the first selected shape, else the default. */
  get shownStyle(): Style {
    const s = this.selectedShapes[0]
    return s ? { fill: s.fill, stroke: s.stroke, strokeWidth: s.strokeWidth } : this.defaultStyle
  }

  /** Boolean on exactly two selected shapes; the lower one in z-order is "A". */
  applyBoolean(op: BooleanOp): boolean {
    if (!this.canBoolean) return false
    const [lower, upper] = this.scene.shapes.filter((s) => this.selection.includes(s.id))
    if (!lower || !upper) return false
    const at = this.scene.shapes.indexOf(lower)
    const result = booleanOp(op, lower, upper, newId())
    const rest = this.scene.shapes.filter((s) => s !== lower && s !== upper)
    const shapes = [...rest]
    if (result) shapes.splice(Math.min(at, shapes.length), 0, result)
    this.record({ shapes })
    this.selection = result ? [result.id] : []
    this.emit()
    return true
  }

  // ---- history ----
  undo() {
    if (!this.history.canUndo) return
    this.redoSel.push([...this.selection])
    this.scene = this.history.undo()
    this.restoreSelection(this.undoSel.pop())
  }
  redo() {
    if (!this.history.canRedo) return
    this.undoSel.push([...this.selection])
    this.scene = this.history.redo()
    this.restoreSelection(this.redoSel.pop())
  }
  private restoreSelection(ids: string[] | undefined) {
    const have = (id: string) => this.scene.shapes.some((s) => s.id === id)
    this.selection = (ids ?? this.selection).filter(have)
    this.emit()
  }

  // ---- documents ----
  /** Starts over (the UI asks for confirmation before calling this). */
  newDocument() {
    this.history.reset(emptyScene())
    this.resetSelectionHistory()
    this.scene = this.history.current
    this.selection = []
    this.emit()
  }
  /** Loads a whole scene as a fresh start (templates, opened files). */
  loadScene(scene: Scene) {
    this.history.reset(scene)
    this.resetSelectionHistory()
    this.scene = scene
    this.selection = []
    this.emit()
  }
  loadSvg(text: string): SourceResult {
    try {
      const r = importSvg(text)
      this.loadScene(r.scene)
      return { ok: true, warnings: r.warnings }
    } catch (e) {
      return { ok: false, error: toError(e) }
    }
  }

  /** Called when the user types in the source editor. Invalid SVG leaves the scene untouched. */
  applySource(text: string): SourceResult {
    try {
      const r = importSvg(text)
      this.record(r.scene)
      this.selection = []
      this.sourceLines = r.lines
      this.emit('source')
      return { ok: true, warnings: r.warnings }
    } catch (e) {
      return { ok: false, error: toError(e) }
    }
  }
}

function toError(e: unknown): SvgError {
  return e instanceof XmlError ? e.info : { key: 'svg.error.syntax' }
}
