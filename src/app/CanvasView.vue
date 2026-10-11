<script lang="ts">
import { defineComponent, markRaw, type PropType } from 'vue'
import type { Editor } from '../core/editor'
import { hitShape, shapeBounds, simplifyStroke } from '../core/paperBridge'
import { intersects } from '../core/geometry'
import { newId, rotateShape, scaleShape, selectionBounds, translateShapes } from '../core/scene'
import type { Point, Rect, Scene, Shape } from '../core/types'

type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'rotate'
const HANDLES: Handle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']
const MIN_ZOOM = 0.1
const MAX_ZOOM = 8

interface Gesture {
  type: 'pan' | 'move' | 'marquee' | 'draw' | 'free' | 'resize' | 'rotate' | 'pinch'
  start: Point
  base?: Scene
  handle?: Handle
  bounds?: Rect
  moved?: boolean
  additive?: boolean
  last?: Point
  points?: Point[]
  // pinch
  dist?: number
  center?: Point
}

// The drawing surface: renders the scene with Vue templates (never v-html), handles the
// tools with Pointer Events (mouse, touch, pen), pan/zoom and the selection frame.
export default defineComponent({
  name: 'CanvasView',
  props: {
    editor: { type: Object as PropType<Editor>, required: true },
    rev: { type: Number, required: true },
    tool: { type: String, required: true },
  },
  emits: ['zoom'],
  data() {
    return {
      zoom: 1,
      panX: 60,
      panY: 60,
      spaceDown: false,
      draft: null as Shape | null,
      draftLine: [] as Point[],
      marquee: null as Rect | null,
      panning: false,
      handles: HANDLES,
    }
  },
  computed: {
    shapes(): Shape[] {
      void this.rev
      return this.editor.scene.shapes
    },
    selBox(): Rect | null {
      void this.rev
      return this.editor.selection.length ? selectionBounds(this.editor.scene, this.editor.selection) : null
    },
    hs(): number {
      return 8 / this.zoom
    },
    gridStyle(): Record<string, string> {
      const size = 24 * this.zoom
      return { backgroundSize: `${size}px ${size}px`, backgroundPosition: `${this.panX}px ${this.panY}px` }
    },
    cursor(): string {
      if (this.panning) return 'grabbing'
      if (this.spaceDown) return 'grab'
      return this.tool === 'select' ? 'default' : 'crosshair'
    },
    groupTransform(): string {
      return `translate(${this.panX} ${this.panY}) scale(${this.zoom})`
    },
    draftPoints(): string {
      return this.draftLine.map((p) => `${p.x},${p.y}`).join(' ')
    },
  },
  created() {
    // Gesture state is not reactive on purpose (plain object, no proxies).
    ;(this as any).g = markRaw({ current: null as Gesture | null, pointers: new Map<number, Point>(), polygon: [] as Point[], hover: null as Point | null })
  },
  mounted() {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    this.$emit('zoom', 100)
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
  },
  watch: {
    tool() {
      this.cancelDraft()
    },
  },
  methods: {
    state() {
      return (this as any).g as { current: Gesture | null; pointers: Map<number, Point>; polygon: Point[]; hover: Point | null }
    },
    isTyping(e: KeyboardEvent): boolean {
      const t = e.target as HTMLElement | null
      return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
    },
    onKeyDown(e: KeyboardEvent) {
      if (e.code === 'Space' && !this.isTyping(e) && !(e.target as HTMLElement)?.closest?.('button')) {
        this.spaceDown = true
        e.preventDefault()
      }
      if (e.key === 'Escape') this.cancelDraft()
      if (e.key === 'Enter' && this.state().polygon.length >= 3 && !this.isTyping(e)) this.finishPolygon()
    },
    onKeyUp(e: KeyboardEvent) {
      if (e.code === 'Space') this.spaceDown = false
    },
    cancelDraft() {
      const st = this.state()
      st.polygon = []
      st.current = null
      this.draft = null
      this.draftLine = []
      this.marquee = null
      this.editor.cancelPreview()
    },

    // ---- coordinates & viewport ----
    local(e: { clientX: number; clientY: number }): Point {
      const r = (this.$refs.svg as SVGSVGElement).getBoundingClientRect()
      return { x: e.clientX - r.left, y: e.clientY - r.top }
    },
    toScene(e: { clientX: number; clientY: number }): Point {
      const p = this.local(e)
      return { x: (p.x - this.panX) / this.zoom, y: (p.y - this.panY) / this.zoom }
    },
    zoomAt(factor: number, at: Point) {
      const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, this.zoom * factor))
      const k = z / this.zoom
      this.panX = at.x - (at.x - this.panX) * k
      this.panY = at.y - (at.y - this.panY) * k
      this.zoom = z
      this.$emit('zoom', Math.round(z * 100))
    },
    center(): Point {
      const r = (this.$refs.svg as SVGSVGElement).getBoundingClientRect()
      return { x: r.width / 2, y: r.height / 2 }
    },
    zoomBy(factor: number) {
      this.zoomAt(factor, this.center())
    },
    resetZoom() {
      this.zoomAt(1 / this.zoom, this.center())
    },
    /** Centres the whole drawing in view (used after loading a template or file). */
    showAll() {
      const box = this.editor.viewBox
      const c = this.center()
      if (!box) {
        this.zoom = 1
        this.panX = 60
        this.panY = 60
      } else {
        this.zoom = Math.min(1.5, Math.max(MIN_ZOOM, Math.min((c.x * 2 - 80) / box.width, (c.y * 2 - 80) / box.height)))
        this.panX = c.x - (box.x + box.width / 2) * this.zoom
        this.panY = c.y - (box.y + box.height / 2) * this.zoom
      }
      this.$emit('zoom', Math.round(this.zoom * 100))
    },
    onWheel(e: WheelEvent) {
      e.preventDefault()
      this.zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), this.local(e))
    },

    // ---- pointer handling ----
    snap(p: Point): Point {
      return { x: Math.round(p.x), y: Math.round(p.y) }
    },
    topShapeAt(p: Point): Shape | null {
      const tol = 4 / this.zoom
      for (let i = this.editor.scene.shapes.length - 1; i >= 0; i--) {
        const s = this.editor.scene.shapes[i]!
        if (hitShape(s, p.x, p.y, tol)) return s
      }
      return null
    },
    onPointerDown(e: PointerEvent) {
      const st = this.state()
      ;(this.$refs.svg as SVGSVGElement).setPointerCapture?.(e.pointerId)
      st.pointers.set(e.pointerId, this.local(e))
      if (st.pointers.size === 2) return this.beginPinch()
      if (st.pointers.size > 2) return
      const p = this.toScene(e)
      if (e.button === 1 || this.spaceDown) {
        st.current = { type: 'pan', start: this.local(e), last: this.local(e) }
        this.panning = true
        return
      }
      if (e.button !== 0) return
      switch (this.tool) {
        case 'select': {
          const hit = this.topShapeAt(p)
          if (hit) {
            if (e.shiftKey) {
              const sel = this.editor.selection
              this.editor.select(sel.includes(hit.id) ? sel.filter((i) => i !== hit.id) : [...sel, hit.id])
              if (!this.editor.selection.includes(hit.id)) return
            } else if (!this.editor.selection.includes(hit.id)) this.editor.select([hit.id])
            st.current = { type: 'move', start: p, base: this.editor.scene, moved: false }
          } else {
            if (!e.shiftKey) this.editor.clearSelection()
            st.current = { type: 'marquee', start: p, additive: e.shiftKey }
          }
          break
        }
        case 'rect':
        case 'ellipse':
          st.current = { type: 'draw', start: this.snap(p) }
          break
        case 'freehand':
          st.current = { type: 'free', start: p, points: [p] }
          this.draftLine = [p]
          break
        case 'polygon': {
          const q = this.snap(p)
          st.polygon = [...st.polygon, q]
          st.hover = q
          this.draftLine = [...st.polygon]
          break
        }
      }
    },
    onHandleDown(e: PointerEvent, handle: Handle) {
      const st = this.state()
      ;(this.$refs.svg as SVGSVGElement).setPointerCapture?.(e.pointerId)
      st.pointers.set(e.pointerId, this.local(e))
      const bounds = this.selBox
      if (!bounds) return
      st.current = { type: handle === 'rotate' ? 'rotate' : 'resize', start: this.toScene(e), base: this.editor.scene, handle, bounds, moved: false }
    },
    onPointerMove(e: PointerEvent) {
      const st = this.state()
      if (st.pointers.has(e.pointerId)) st.pointers.set(e.pointerId, this.local(e))
      const g = st.current
      if (g?.type === 'pinch') return this.updatePinch()
      const p = this.toScene(e)
      if (this.tool === 'polygon' && st.polygon.length) {
        st.hover = this.snap(p)
        this.draftLine = [...st.polygon, st.hover]
      }
      if (!g) return
      switch (g.type) {
        case 'pan': {
          const l = this.local(e)
          this.panX += l.x - g.last!.x
          this.panY += l.y - g.last!.y
          g.last = l
          break
        }
        case 'move': {
          const dx = Math.round(p.x - g.start.x)
          const dy = Math.round(p.y - g.start.y)
          if (!g.moved && dx === 0 && dy === 0) break
          g.moved = true
          this.editor.preview(translateShapes(g.base!, this.editor.selection, dx, dy))
          break
        }
        case 'marquee':
          this.marquee = this.rectOf(g.start, p)
          break
        case 'draw': {
          const q = this.snap(p)
          this.draft = this.makeShape(g.start, q, e.shiftKey)
          break
        }
        case 'free':
          g.points!.push(p)
          this.draftLine = [...g.points!]
          break
        case 'resize':
          g.moved = true
          this.editor.preview(this.resized(g, p, e.shiftKey))
          break
        case 'rotate':
          g.moved = true
          this.editor.preview(this.rotated(g, p, e.shiftKey))
          break
      }
    },
    onPointerUp(e: PointerEvent) {
      const st = this.state()
      st.pointers.delete(e.pointerId)
      const g = st.current
      if (!g) return
      if (g.type === 'pinch') {
        if (st.pointers.size < 2) st.current = null
        return
      }
      st.current = null
      this.panning = false
      const p = this.toScene(e)
      switch (g.type) {
        case 'move':
        case 'resize':
        case 'rotate':
          if (g.moved) this.editor.commit(this.editor.scene)
          break
        case 'marquee': {
          const box = this.rectOf(g.start, p)
          this.marquee = null
          if (box.width < 2 && box.height < 2) break
          const hit = this.editor.scene.shapes.filter((s) => intersects(shapeBounds(s), box)).map((s) => s.id)
          this.editor.select(g.additive ? [...new Set([...this.editor.selection, ...hit])] : hit)
          break
        }
        case 'draw': {
          const shape = this.makeShape(g.start, this.snap(p), e.shiftKey)
          this.draft = null
          if (shape) this.editor.add(shape)
          break
        }
        case 'free': {
          this.draftLine = []
          const pts = g.points!
          if (pts.length < 3) break
          const d = simplifyStroke(pts, 2.5 / this.zoom)
          if (!d) break
          const style = this.editor.defaultStyle
          this.editor.add({
            kind: 'path', id: newId(), d, fill: 'none',
            stroke: style.stroke === 'none' ? '#0f172a' : style.stroke,
            strokeWidth: Math.max(style.strokeWidth, 2),
          })
          break
        }
      }
    },
    onDblClick() {
      if (this.tool === 'polygon') this.finishPolygon()
    },
    finishPolygon() {
      const st = this.state()
      const pts = st.polygon.filter((p, i, a) => i === 0 || p.x !== a[i - 1]!.x || p.y !== a[i - 1]!.y)
      st.polygon = []
      this.draftLine = []
      if (pts.length < 3) return
      this.editor.add({ kind: 'polygon', id: newId(), points: pts, ...this.editor.defaultStyle })
    },
    beginPinch() {
      const st = this.state()
      this.editor.cancelPreview()
      this.draft = null
      this.marquee = null
      this.draftLine = []
      const [a, b] = [...st.pointers.values()]
      st.current = { type: 'pinch', start: a!, dist: Math.hypot(a!.x - b!.x, a!.y - b!.y), center: { x: (a!.x + b!.x) / 2, y: (a!.y + b!.y) / 2 } }
    },
    updatePinch() {
      const st = this.state()
      const g = st.current!
      const [a, b] = [...st.pointers.values()]
      if (!a || !b) return
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      const c = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      this.panX += c.x - g.center!.x
      this.panY += c.y - g.center!.y
      if (g.dist) this.zoomAt(dist / g.dist, c)
      g.dist = dist
      g.center = c
    },

    // ---- gesture helpers ----
    rectOf(a: Point, b: Point): Rect {
      return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), width: Math.abs(a.x - b.x), height: Math.abs(a.y - b.y) }
    },
    makeShape(a: Point, b: Point, square: boolean): Shape | null {
      let dx = b.x - a.x
      let dy = b.y - a.y
      if (square) {
        const m = Math.max(Math.abs(dx), Math.abs(dy))
        dx = Math.sign(dx || 1) * m
        dy = Math.sign(dy || 1) * m
      }
      const r = this.rectOf(a, { x: a.x + dx, y: a.y + dy })
      if (r.width < 2 || r.height < 2) return null
      const style = this.editor.defaultStyle
      if (this.tool === 'rect') return { kind: 'rect', id: newId(), ...r, rotation: 0, ...style }
      return { kind: 'ellipse', id: newId(), cx: r.x + r.width / 2, cy: r.y + r.height / 2, rx: r.width / 2, ry: r.height / 2, rotation: 0, ...style }
    },
    resized(g: Gesture, p: Point, keepRatio: boolean): Scene {
      const b = g.bounds!
      const h = g.handle!
      const left = h.includes('w')
      const right = h.includes('e')
      const top = h.includes('n')
      const bottom = h.includes('s')
      const origin = { x: left ? b.x + b.width : b.x, y: top ? b.y + b.height : b.y }
      const grabX = left ? b.x : b.x + b.width
      const grabY = top ? b.y : b.y + b.height
      let sx = left || right ? (Math.round(p.x) - origin.x) / (grabX - origin.x || 1) : 1
      let sy = top || bottom ? (Math.round(p.y) - origin.y) / (grabY - origin.y || 1) : 1
      if (keepRatio && (left || right) && (top || bottom)) {
        const m = Math.max(Math.abs(sx), Math.abs(sy))
        sx = Math.sign(sx || 1) * m
        sy = Math.sign(sy || 1) * m
      }
      if (Math.abs(sx) < 0.02) sx = 0.02 * Math.sign(sx || 1)
      if (Math.abs(sy) < 0.02) sy = 0.02 * Math.sign(sy || 1)
      const sel = this.editor.selection
      return { shapes: g.base!.shapes.map((s) => (sel.includes(s.id) ? scaleShape(s, sx, sy, origin) : s)) }
    },
    rotated(g: Gesture, p: Point, snap: boolean): Scene {
      const b = g.bounds!
      const c = { x: b.x + b.width / 2, y: b.y + b.height / 2 }
      const a0 = Math.atan2(g.start.y - c.y, g.start.x - c.x)
      const a1 = Math.atan2(p.y - c.y, p.x - c.x)
      let deg = ((a1 - a0) * 180) / Math.PI
      deg = snap ? Math.round(deg / 15) * 15 : Math.round(deg)
      const sel = this.editor.selection
      return { shapes: g.base!.shapes.map((s) => (sel.includes(s.id) ? rotateShape(s, deg, c) : s)) }
    },

    // ---- template helpers ----
    handlePos(h: Handle, b: Rect): Point {
      const xs = { w: b.x, e: b.x + b.width, c: b.x + b.width / 2 }
      const ys = { n: b.y, s: b.y + b.height, c: b.y + b.height / 2 }
      return { x: h.includes('w') ? xs.w : h.includes('e') ? xs.e : xs.c, y: h.includes('n') ? ys.n : h.includes('s') ? ys.s : ys.c }
    },
    handleCursor(h: Handle): string {
      return ({ nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize', n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize', rotate: 'grab' } as const)[h]
    },
    rotationAttr(s: Shape): string | undefined {
      if (s.kind === 'rect' && s.rotation) return `rotate(${s.rotation} ${s.x + s.width / 2} ${s.y + s.height / 2})`
      if (s.kind === 'ellipse' && s.rotation) return `rotate(${s.rotation} ${s.cx} ${s.cy})`
      return undefined
    },
    pointsAttr(s: Shape): string {
      return s.kind === 'polygon' ? s.points.map((p) => `${p.x},${p.y}`).join(' ') : ''
    },
  },
})
</script>

<template>
  <div class="canvas-wrap" :style="{ ...gridStyle, cursor }" data-testid="canvas">
    <svg
      ref="svg" class="canvas-svg" role="application" :aria-label="$t('app.canvas')" tabindex="0"
      @pointerdown="onPointerDown" @pointermove="onPointerMove" @pointerup="onPointerUp" @pointercancel="onPointerUp"
      @dblclick="onDblClick" @wheel="onWheel" @contextmenu.prevent
    >
      <g :transform="groupTransform">
        <template v-for="s in shapes" :key="s.id">
          <rect v-if="s.kind === 'rect'" data-shape="rect" :x="s.x" :y="s.y" :width="s.width" :height="s.height" :fill="s.fill" :stroke="s.stroke" :stroke-width="s.strokeWidth" :transform="rotationAttr(s)" />
          <ellipse v-else-if="s.kind === 'ellipse'" data-shape="ellipse" :cx="s.cx" :cy="s.cy" :rx="s.rx" :ry="s.ry" :fill="s.fill" :stroke="s.stroke" :stroke-width="s.strokeWidth" :transform="rotationAttr(s)" />
          <polygon v-else-if="s.kind === 'polygon'" data-shape="polygon" :points="pointsAttr(s)" :fill="s.fill" :stroke="s.stroke" :stroke-width="s.strokeWidth" />
          <path v-else data-shape="path" :d="s.d" fill-rule="evenodd" :fill="s.fill" :stroke="s.stroke" :stroke-width="s.strokeWidth" />
        </template>

        <!-- drafts while drawing -->
        <rect v-if="draft && draft.kind === 'rect'" :x="draft.x" :y="draft.y" :width="draft.width" :height="draft.height" :fill="draft.fill" :stroke="draft.stroke" :stroke-width="draft.strokeWidth" opacity="0.7" />
        <ellipse v-if="draft && draft.kind === 'ellipse'" :cx="draft.cx" :cy="draft.cy" :rx="draft.rx" :ry="draft.ry" :fill="draft.fill" :stroke="draft.stroke" :stroke-width="draft.strokeWidth" opacity="0.7" />
        <polyline v-if="draftLine.length" :points="draftPoints" fill="none" stroke="#2ec4b6" :stroke-width="2 / zoom" :stroke-dasharray="`${6 / zoom} ${4 / zoom}`" />
        <rect v-for="(p, i) in tool === 'polygon' ? draftLine : []" :key="'v' + i" :x="p.x - hs / 2" :y="p.y - hs / 2" :width="hs" :height="hs" fill="#2ec4b6" />

        <rect v-if="marquee" :x="marquee.x" :y="marquee.y" :width="marquee.width" :height="marquee.height" fill="#2ec4b6" fill-opacity="0.12" stroke="#2ec4b6" :stroke-width="1.5 / zoom" :stroke-dasharray="`${5 / zoom} ${3 / zoom}`" />

        <!-- selection frame with square handles -->
        <g v-if="selBox && tool === 'select'" data-testid="selection">
          <rect :x="selBox.x" :y="selBox.y" :width="selBox.width" :height="selBox.height" fill="none" stroke="#2ec4b6" :stroke-width="2 / zoom" pointer-events="none" />
          <line :x1="selBox.x + selBox.width / 2" :y1="selBox.y" :x2="selBox.x + selBox.width / 2" :y2="selBox.y - 22 / zoom" stroke="#2ec4b6" :stroke-width="2 / zoom" pointer-events="none" />
          <rect
            v-for="h in handles" :key="h" :data-handle="h" class="handle"
            :x="handlePos(h, selBox).x - hs / 2" :y="handlePos(h, selBox).y - hs / 2" :width="hs" :height="hs"
            fill="#ffffff" stroke="#0f172a" :stroke-width="1.5 / zoom" :style="{ cursor: handleCursor(h) }"
            @pointerdown.stop="onHandleDown($event, h)"
          />
          <rect
            data-handle="rotate" class="handle" :x="selBox.x + selBox.width / 2 - hs / 2" :y="selBox.y - 22 / zoom - hs / 2" :width="hs" :height="hs"
            fill="#ffc93c" stroke="#0f172a" :stroke-width="1.5 / zoom" style="cursor: grab" @pointerdown.stop="onHandleDown($event, 'rotate')"
          />
        </g>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.canvas-wrap {
  position: relative; width: 100%; height: 100%; overflow: hidden; background-color: var(--bg);
  background-image: radial-gradient(var(--canvas-dot) 1.2px, transparent 1.2px);
}
.canvas-svg { width: 100%; height: 100%; display: block; touch-action: none; user-select: none; }
.canvas-svg:focus-visible { outline-offset: -4px; }
</style>
