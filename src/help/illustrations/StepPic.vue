<script lang="ts">
import { defineComponent } from 'vue'

// Small static pictures for the four "getting started" steps.
// Shape outlines use a fixed hex ink on bright fills (readable in both themes);
// loose lines use currentColor, which follows the theme.
export default defineComponent({
  name: 'StepPic',
  props: {
    name: { type: String, required: true },
    label: { type: String, required: true },
  },
})
</script>

<template>
  <svg class="help-pic" viewBox="0 0 120 80" role="img" :aria-label="label" focusable="false">
    <g v-if="name === 'draw'" stroke-linejoin="round">
      <rect x="12" y="14" width="56" height="44" fill="#ffc93c" stroke="#0f172a" stroke-width="3" />
      <path d="M 10 70 C 28 60 42 76 60 64 S 90 58 104 68" fill="none" stroke="#ff6b6b" stroke-width="3" stroke-linecap="round" />
      <path d="M 88 30 L 100 10 L 112 18 L 100 38 Z" fill="#2ec4b6" stroke="#0f172a" stroke-width="2.5" />
    </g>
    <g v-else-if="name === 'select'" stroke-linejoin="round">
      <rect x="24" y="22" width="50" height="34" fill="#2ec4b6" stroke="#0f172a" stroke-width="3" />
      <rect x="18" y="16" width="62" height="46" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="4 3" />
      <rect x="14" y="12" width="6" height="6" fill="#ffffff" stroke="#0f172a" stroke-width="1.5" />
      <rect x="77" y="12" width="6" height="6" fill="#ffffff" stroke="#0f172a" stroke-width="1.5" />
      <rect x="14" y="58" width="6" height="6" fill="#ffffff" stroke="#0f172a" stroke-width="1.5" />
      <rect x="77" y="58" width="6" height="6" fill="#ffffff" stroke="#0f172a" stroke-width="1.5" />
      <path d="M 88 40 L 88 66 L 95 59 L 102 74 L 107 71 L 100 56 L 109 56 Z" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
    </g>
    <g v-else-if="name === 'colour'">
      <rect x="10" y="14" width="26" height="26" fill="#ff6b6b" stroke="#0f172a" stroke-width="3" />
      <rect x="46" y="10" width="34" height="34" fill="#2ec4b6" stroke="#0f172a" stroke-width="4" />
      <rect x="84" y="14" width="26" height="26" fill="#ffc93c" stroke="#0f172a" stroke-width="3" />
      <path d="M 63 48 L 63 52" stroke="currentColor" stroke-width="2" />
      <circle cx="63" cy="64" r="12" fill="#2ec4b6" stroke="#0f172a" stroke-width="3" />
    </g>
    <g v-else stroke-linejoin="round">
      <path d="M 26 6 H 70 L 90 26 V 74 H 26 Z" fill="#ffffff" stroke="#0f172a" stroke-width="3" />
      <text x="58" y="50" text-anchor="middle" font-size="15" font-weight="700" fill="#0f172a" stroke="none" font-family="monospace">SVG</text>
      <path d="M 106 22 V 52 M 97 43 L 106 52 L 115 43" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="square" />
    </g>
  </svg>
</template>

<style scoped>
.help-pic {
  display: block;
  width: 100%;
  max-width: 12rem;
  height: auto;
  margin: 0 auto;
  color: var(--ink);
}
</style>
