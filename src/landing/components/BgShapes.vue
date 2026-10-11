<script lang="ts">
import { defineComponent } from 'vue'

type Floater = {
  kind: 'square' | 'circle' | 'triangle' | 'star' | 'zigzag' | 'plus' | 'ring'
  x: number // left, percent
  y: number // top, percent
  size: number // px
  depth: number // parallax factor
  fill: string
  dur: number // ms, one bob/rotate cycle
  delay: number // ms
  mobile: boolean // also shown on small screens
}

// Decorative floating shapes behind the hero. Parallax comes from the CSS variables
// --px/--py that the page sets on pointer move; nothing here is interactive.
const FLOATERS: Floater[] = [
  { kind: 'square', x: 3, y: 8, size: 54, depth: 18, fill: 'var(--accent)', dur: 9000, delay: 0, mobile: true },
  { kind: 'circle', x: 88, y: 8, size: 64, depth: -24, fill: 'var(--danger)', dur: 11000, delay: -2000, mobile: true },
  { kind: 'triangle', x: 70, y: 62, size: 70, depth: 30, fill: 'var(--primary)', dur: 12000, delay: -5000, mobile: false },
  { kind: 'star', x: 46, y: 4, size: 46, depth: -14, fill: 'var(--primary)', dur: 14000, delay: -1000, mobile: false },
  { kind: 'zigzag', x: 2, y: 50, size: 96, depth: 22, fill: 'var(--danger)', dur: 10000, delay: -3000, mobile: false },
  { kind: 'plus', x: 94, y: 40, size: 40, depth: -30, fill: 'var(--accent)', dur: 8000, delay: -4000, mobile: false },
  { kind: 'ring', x: 54, y: 80, size: 58, depth: 12, fill: 'var(--accent)', dur: 13000, delay: -6000, mobile: false },
  { kind: 'square', x: 60, y: 30, size: 26, depth: -36, fill: 'var(--danger)', dur: 7000, delay: -2500, mobile: false },
]

export default defineComponent({
  name: 'BgShapes',
  data() {
    return { floaters: FLOATERS }
  },
  methods: {
    style(f: Floater): Record<string, string> {
      return {
        left: f.x + '%',
        top: f.y + '%',
        width: f.size + 'px',
        height: f.size + 'px',
        '--d': String(f.depth),
        '--dur': f.dur + 'ms',
        '--delay': f.delay + 'ms',
      }
    },
  },
})
</script>

<template>
  <div class="lp-floaters" aria-hidden="true">
    <div v-for="(f, i) in floaters" :key="i" class="lp-floater" :class="{ 'is-desktop': !f.mobile }" :style="style(f)">
      <svg class="lp-floater-svg" viewBox="0 0 60 60" width="100%" height="100%" focusable="false">
        <g v-if="f.kind === 'square'">
          <rect x="10" y="10" width="46" height="46" fill="var(--shadow)" />
          <rect x="4" y="4" width="46" height="46" :fill="f.fill" stroke="var(--ink)" stroke-width="3" />
        </g>
        <g v-else-if="f.kind === 'circle'">
          <circle cx="32" cy="32" r="24" fill="var(--shadow)" />
          <circle cx="27" cy="27" r="24" :fill="f.fill" stroke="var(--ink)" stroke-width="3" />
        </g>
        <g v-else-if="f.kind === 'triangle'">
          <path d="M34 9 L57 55 H11 Z" fill="var(--shadow)" />
          <path d="M29 4 L52 50 H6 Z" :fill="f.fill" stroke="var(--ink)" stroke-width="3" stroke-linejoin="round" />
        </g>
        <g v-else-if="f.kind === 'star'">
          <path d="M33 7l7 15 16 2-12 11 3 16-14-8-14 8 3-16-12-11 16-2z" fill="var(--shadow)" />
          <path d="M30 4l7 15 16 2-12 11 3 16-14-8-14 8 3-16-12-11 16-2z" :fill="f.fill" stroke="var(--ink)" stroke-width="3" stroke-linejoin="round" />
        </g>
        <g v-else-if="f.kind === 'zigzag'">
          <path d="M5 37 l10-14 10 14 10-14 10 14 10-14" fill="none" stroke="var(--shadow)" stroke-width="8" />
          <path d="M2 34 l10-14 10 14 10-14 10 14 10-14" fill="none" :stroke="f.fill" stroke-width="7" />
        </g>
        <g v-else-if="f.kind === 'plus'">
          <path d="M25 9h14v16h16v14H39v16H25V39H9V25h16z" fill="var(--shadow)" />
          <path d="M21 5h14v16h16v14H35v16H21V35H5V21h16z" :fill="f.fill" stroke="var(--ink)" stroke-width="3" />
        </g>
        <g v-else>
          <circle cx="32" cy="32" r="20" fill="none" stroke="var(--shadow)" stroke-width="10" />
          <circle cx="28" cy="28" r="20" fill="none" stroke="var(--ink)" stroke-width="12" />
          <circle cx="28" cy="28" r="20" fill="none" :stroke="f.fill" stroke-width="7" />
        </g>
      </svg>
    </div>
  </div>
</template>
