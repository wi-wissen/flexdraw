<script lang="ts">
import { defineComponent } from 'vue'

type Piece = {
  shape: 'A' | 'B'
  /** Fill colour, or null for no fill. */
  color: string | null
  /** Mask name (notA, inA, notB, inB) that limits the fill, or null. */
  fillMask: string | null
  /** Mask name that limits the outline, or null. */
  strokeMask: string | null
}

// A = square (first shape), B = circle (second shape).
// Each result is built from the two shapes with SVG masks, so no path maths is needed.
const PIECES: Record<string, Piece[]> = {
  unite: [
    { shape: 'A', color: '#ffc93c', fillMask: null, strokeMask: 'notB' },
    { shape: 'B', color: '#2ec4b6', fillMask: null, strokeMask: 'notA' },
  ],
  intersect: [
    { shape: 'A', color: '#ff6b6b', fillMask: 'inB', strokeMask: 'inB' },
    { shape: 'B', color: null, fillMask: null, strokeMask: 'inA' },
  ],
  subtract: [
    { shape: 'A', color: '#ffc93c', fillMask: 'notB', strokeMask: 'notB' },
    { shape: 'B', color: null, fillMask: null, strokeMask: 'inA' },
  ],
  exclude: [
    { shape: 'A', color: '#ffc93c', fillMask: 'notB', strokeMask: 'notB' },
    { shape: 'B', color: '#2ec4b6', fillMask: 'notA', strokeMask: 'notA' },
  ],
}

let instances = 0

export default defineComponent({
  name: 'BoolPic',
  props: {
    op: { type: String, required: true },
    beforeLabel: { type: String, required: true },
    afterLabel: { type: String, required: true },
  },
  data() {
    instances += 1
    return {
      uid: `bool-${instances}`,
      rectA: { x: 8, y: 10, w: 56, h: 56 },
      circleB: { cx: 64, cy: 44, r: 28 },
    }
  },
  computed: {
    pieces(): Piece[] {
      return PIECES[this.op] ?? []
    },
  },
  methods: {
    maskId(name: string): string {
      return `${this.uid}-${name}`
    },
    maskUrl(name: string | null): string | undefined {
      return name ? `url(#${this.maskId(name)})` : undefined
    },
  },
})
</script>

<template>
  <div class="help-bool">
    <svg class="help-pic-bool" viewBox="0 0 120 90" role="img" :aria-label="beforeLabel" focusable="false">
      <rect :x="rectA.x" :y="rectA.y" :width="rectA.w" :height="rectA.h" fill="#ffc93c" stroke="#0f172a" stroke-width="3" />
      <circle :cx="circleB.cx" :cy="circleB.cy" :r="circleB.r" fill="#2ec4b6" stroke="#0f172a" stroke-width="3" />
    </svg>
    <span class="help-arrow" aria-hidden="true">→</span>
    <svg class="help-pic-bool" viewBox="0 0 120 90" role="img" :aria-label="afterLabel" focusable="false">
      <defs>
        <mask :id="maskId('notA')" maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="90">
          <rect x="0" y="0" width="120" height="90" fill="#ffffff" />
          <rect :x="rectA.x" :y="rectA.y" :width="rectA.w" :height="rectA.h" fill="#000000" />
        </mask>
        <mask :id="maskId('inA')" maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="90">
          <rect x="0" y="0" width="120" height="90" fill="#000000" />
          <rect :x="rectA.x" :y="rectA.y" :width="rectA.w" :height="rectA.h" fill="#ffffff" />
        </mask>
        <mask :id="maskId('notB')" maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="90">
          <rect x="0" y="0" width="120" height="90" fill="#ffffff" />
          <circle :cx="circleB.cx" :cy="circleB.cy" :r="circleB.r" fill="#000000" />
        </mask>
        <mask :id="maskId('inB')" maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="90">
          <rect x="0" y="0" width="120" height="90" fill="#000000" />
          <circle :cx="circleB.cx" :cy="circleB.cy" :r="circleB.r" fill="#ffffff" />
        </mask>
      </defs>
      <g v-for="(p, i) in pieces" :key="i" stroke-linejoin="round">
        <g :mask="maskUrl(p.fillMask)">
          <rect v-if="p.shape === 'A'" :x="rectA.x" :y="rectA.y" :width="rectA.w" :height="rectA.h" :fill="p.color ?? 'none'" stroke="none" />
          <circle v-else :cx="circleB.cx" :cy="circleB.cy" :r="circleB.r" :fill="p.color ?? 'none'" stroke="none" />
        </g>
        <g :mask="maskUrl(p.strokeMask)">
          <rect v-if="p.shape === 'A'" :x="rectA.x" :y="rectA.y" :width="rectA.w" :height="rectA.h" fill="none" stroke="#0f172a" stroke-width="3" />
          <circle v-else :cx="circleB.cx" :cy="circleB.cy" :r="circleB.r" fill="none" stroke="#0f172a" stroke-width="3" />
        </g>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.help-bool {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--ink);
}
.help-pic-bool {
  display: block;
  width: 9rem;
  max-width: 42%;
  height: auto;
}
.help-arrow {
  font-size: 1.5rem;
  font-weight: 700;
}
</style>
