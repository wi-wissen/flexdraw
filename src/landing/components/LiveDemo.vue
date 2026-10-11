<script lang="ts">
import { defineComponent } from 'vue'
import LpIcon from './LpIcon.vue'
import {
  START_MS, demoLines, demoShapes, lineEnds, nextTick, sliceTokens,
  type DemoLine, type DemoShape, type Token,
} from '../demo'

type RenderLine = { tokens: Token[]; rest: string; state: 'done' | 'active' | 'pending' }

// The signature demo: drawing on the left, SVG source typed on the right, in sync.
// `paused` comes from the page (one switch for all motion); `reduced` shows the final state.
export default defineComponent({
  name: 'LiveDemo',
  components: { LpIcon },
  props: {
    paused: { type: Boolean, default: false },
    reduced: { type: Boolean, default: false },
  },
  emits: ['toggle'],
  data() {
    return { typed: 0, cycle: 0, timer: 0 }
  },
  computed: {
    shapes(): DemoShape[] {
      return demoShapes(this.cycle)
    },
    lines(): DemoLine[] {
      return demoLines(this.cycle)
    },
    ends(): number[] {
      return lineEnds(this.lines)
    },
    total(): number {
      return this.ends[this.ends.length - 1] ?? 0
    },
    /** Index of the line that holds the caret; -1 when everything is typed. */
    activeLine(): number {
      return this.ends.findIndex((e) => this.typed < e)
    },
    renderLines(): RenderLine[] {
      return this.lines.map((l, i) => {
        const start = this.ends[i]! - l.len
        const shown = Math.max(0, Math.min(l.len, this.typed - start))
        const state = shown >= l.len ? 'done' : i === this.activeLine ? 'active' : 'pending'
        // The untyped rest is rendered invisibly so the panel never jumps while typing.
        const rest = l.tokens.map((t) => t.v).join('').slice(shown)
        return { tokens: sliceTokens(l.tokens, shown), rest, state }
      })
    },
    /** Shapes whose code line is complete. */
    doneShapes(): number[] {
      return this.lines.flatMap((l, i) => (l.shape !== null && this.typed >= this.ends[i]! ? [l.shape] : []))
    },
    /** The shape whose line is being typed right now (drawn as a dashed ghost). */
    ghostShape(): number | null {
      if (this.activeLine < 0) return null
      const line = this.lines[this.activeLine]!
      const start = this.ends[this.activeLine]! - line.len
      return this.typed > start ? line.shape : null
    },
    stepLabel(): string {
      const shapeLines = this.lines.filter((l) => l.shape !== null).length
      if (this.activeLine < 0) return this.$t('landing.demo.done')
      const line = this.lines[this.activeLine]!
      if (line.shape === null) return this.$t(this.activeLine === 0 ? 'landing.demo.begin' : 'landing.demo.end')
      return this.$t('landing.demo.step', {
        n: line.shape + 1,
        total: shapeLines,
        name: this.$t('landing.demo.shapes.' + this.shapes[line.shape]!.key),
      })
    },
    progress(): number {
      return this.total ? Math.round((this.typed / this.total) * 100) : 0
    },
  },
  watch: {
    paused() {
      this.sync()
    },
    reduced() {
      this.sync()
    },
  },
  mounted() {
    this.sync()
  },
  beforeUnmount() {
    this.stop()
  },
  methods: {
    attrs(s: DemoShape): Record<string, string> {
      return Object.fromEntries(s.attrs)
    },
    stop() {
      if (this.timer) window.clearTimeout(this.timer)
      this.timer = 0
    },
    schedule(ms: number) {
      this.stop()
      this.timer = window.setTimeout(() => this.step(), ms)
    },
    sync() {
      if (this.paused) {
        this.stop()
        // Reduced motion starts paused: show the finished picture, not an empty canvas.
        if (this.reduced) this.typed = this.total
      } else if (!this.timer) {
        this.schedule(this.typed === 0 ? START_MS : 0)
      }
    },
    step() {
      this.timer = 0
      if (this.typed >= this.total) {
        this.cycle += 1
        this.typed = 0
        this.schedule(START_MS)
        return
      }
      const t = nextTick(this.typed, this.ends)
      this.typed = t.typed
      this.schedule(t.delay)
    },
  },
})
</script>

<template>
  <figure class="lp-demo" :aria-label="$t('landing.demo.label')">
    <div class="lp-demo-window">
      <div class="lp-demo-bar">
        <span class="lp-demo-dots" aria-hidden="true"><i /><i /><i /></span>
        <span class="lp-demo-file is-mono">{{ $t('landing.demo.file') }}</span>
        <span class="lp-demo-live" :class="{ 'is-off': paused || reduced }">{{ paused ? $t('landing.demo.pausedTag') : $t('landing.demo.liveTag') }}</span>
      </div>
      <div class="lp-demo-panes">
        <div class="lp-demo-canvas">
          <span class="lp-demo-pane-label">{{ $t('landing.demo.drawing') }}</span>
          <svg class="lp-demo-svg" viewBox="0 0 240 200" role="img" :aria-label="$t('landing.demo.svgLabel')" data-testid="demo-svg">
            <g v-for="i in doneShapes" :key="cycle + '-' + i" class="lp-demo-shape" data-testid="demo-shape">
              <rect v-if="shapes[i]!.tag === 'rect'" v-bind="attrs(shapes[i]!)" />
              <circle v-else-if="shapes[i]!.tag === 'circle'" v-bind="attrs(shapes[i]!)" />
              <ellipse v-else-if="shapes[i]!.tag === 'ellipse'" v-bind="attrs(shapes[i]!)" />
              <polygon v-else-if="shapes[i]!.tag === 'polygon'" v-bind="attrs(shapes[i]!)" />
              <path v-else v-bind="attrs(shapes[i]!)" stroke-linecap="round" />
            </g>
            <g v-if="ghostShape !== null" class="lp-demo-ghost" aria-hidden="true">
              <rect v-if="shapes[ghostShape]!.tag === 'rect'" v-bind="attrs(shapes[ghostShape]!)" />
              <circle v-else-if="shapes[ghostShape]!.tag === 'circle'" v-bind="attrs(shapes[ghostShape]!)" />
              <ellipse v-else-if="shapes[ghostShape]!.tag === 'ellipse'" v-bind="attrs(shapes[ghostShape]!)" />
              <polygon v-else-if="shapes[ghostShape]!.tag === 'polygon'" v-bind="attrs(shapes[ghostShape]!)" />
              <path v-else v-bind="attrs(shapes[ghostShape]!)" />
            </g>
          </svg>
        </div>
        <div class="lp-demo-code">
          <span class="lp-demo-pane-label">{{ $t('landing.demo.code') }}</span>
          <pre class="is-mono" aria-hidden="true"><code><span v-for="(l, i) in renderLines" :key="i" class="lp-demo-line" :class="'is-' + l.state" data-testid="demo-line"><template v-for="(t, j) in l.tokens" :key="j"><span v-if="t.c === 'swatch'" class="tk-swatch" :style="{ background: t.color }" /><span v-else :class="'tk-' + t.c">{{ t.v }}</span></template><span v-if="l.state === 'active'" class="lp-caret" /><span v-if="l.rest" class="lp-rest">{{ l.rest }}</span></span></code></pre>
        </div>
      </div>
      <div class="lp-demo-foot">
        <button type="button" class="nb-btn lp-demo-toggle" data-testid="demo-toggle" :aria-pressed="paused" @click="$emit('toggle')">
          <LpIcon :name="paused ? 'play' : 'pause'" />{{ paused ? $t('landing.motion.play') : $t('landing.motion.pause') }}
        </button>
        <div class="lp-demo-status" aria-hidden="true">
          <span class="lp-demo-step">{{ stepLabel }}</span>
          <span class="lp-demo-progress"><span :style="{ width: progress + '%' }" /></span>
        </div>
      </div>
    </div>
    <figcaption class="sr-only">{{ $t('landing.demo.caption') }}</figcaption>
  </figure>
</template>
