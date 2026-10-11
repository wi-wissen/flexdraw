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
export type Origin = 'scene' | 'source'
export type ChangeListener = (origin: Origin) => void

export type SourceResult = { ok: true; warnings: string[] } | { ok: false; error: SvgError }

export class Editor {
  scene: Scene
  selection: string[] = []
  defaultStyle: Style = { ...DEFAULT_STYLE }
  private history: History
  private clipboard: Shape[] = []
  private listeners = new Set<ChangeListener>()

  constructor(scene: Scene = emptyScene()) {
    this.scene = scene
    this.history = new History(scene)
  }

  onChange(fn: ChangeListener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }
  private emit(origin: Origin = 'scene') {
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
    this.scene = this.history.push(next)
    this.emit()
  }
  /** Drop an uncommitted preview. */
  cancelPreview() {
    this.scene = this.history.current
    this.emit()
  }

  // ---- selection ----
  select(ids: string[]) {
    this.selection = ids.filter((id) => this.scene.shapes.some((s) => s.id === id))
    this.emit()
  }
  selectAll() {
    this.select(this.scene.shapes.map((s) => s.id))
  }
  clearSelection() {
    this.select([])
  }

  // ---- editing ----
  add(shape: Shape) {
    this.commit(addShape(this.scene, shape))
    this.select([shape.id])
  }
  deleteSelection() {
    if (!this.selection.length) return
    this.commit(removeShapes(this.scene, this.selection))
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
    this.commit(r.scene)
    this.select(r.ids)
  }
  copy() {
    this.clipboard = this.selectedShapes
  }
  paste() {
    if (!this.clipboard.length) return
    const copies = this.clipboard.map((s) => ({ ...s, id: newId() }) as Shape)
    this.commit({ shapes: [...this.scene.shapes, ...copies] })
    this.select(copies.map((c) => c.id))
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
    this.commit({ shapes })
    this.select(result ? [result.id] : [])
    return true
  }

  // ---- history ----
  undo() {
    this.scene = this.history.undo()
    this.selection = this.selection.filter((id) => this.scene.shapes.some((s) => s.id === id))
    this.emit()
  }
  redo() {
    this.scene = this.history.redo()
    this.selection = this.selection.filter((id) => this.scene.shapes.some((s) => s.id === id))
    this.emit()
  }

  // ---- documents ----
  /** Starts over (the UI asks for confirmation before calling this). */
  newDocument() {
    this.history.reset(emptyScene())
    this.scene = this.history.current
    this.selection = []
    this.emit()
  }
  /** Loads a whole scene as a fresh start (templates, opened files). */
  loadScene(scene: Scene) {
    this.history.reset(scene)
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
      this.scene = this.history.push(r.scene)
      this.selection = []
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
