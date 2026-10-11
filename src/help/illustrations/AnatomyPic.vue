<script lang="ts">
import { defineComponent } from 'vue'

// A circle with its centre (cx, cy) and radius (r) marked. Labels come in translated.
export default defineComponent({
  name: 'AnatomyPic',
  props: {
    label: { type: String, required: true },
    centre: { type: String, required: true },
    radius: { type: String, required: true },
  },
})
</script>

<template>
  <svg class="help-pic" viewBox="0 0 220 150" role="img" :aria-label="label" width="220" height="150">
    <rect x="1" y="1" width="218" height="148" fill="var(--panel)" stroke="var(--ink)" stroke-width="2" />
    <line x1="1" y1="20" x2="219" y2="20" stroke="var(--canvas-dot)" stroke-width="1" />
    <line x1="30" y1="1" x2="30" y2="149" stroke="var(--canvas-dot)" stroke-width="1" />
    <circle cx="100" cy="80" r="50" fill="#ffc93c" stroke="#0f172a" stroke-width="4" />
    <line x1="100" y1="80" x2="150" y2="80" stroke="#0f172a" stroke-width="3" stroke-dasharray="6 4" />
    <rect x="95" y="75" width="10" height="10" fill="#ff6b6b" stroke="#0f172a" stroke-width="2" />
    <text x="100" y="106" text-anchor="middle" font-family="JetBrains Mono Variable, monospace" font-size="11" font-weight="700" fill="#0f172a">cx, cy</text>
    <text x="125" y="74" font-family="JetBrains Mono Variable, monospace" font-size="11" font-weight="700" fill="#0f172a">r</text>
    <text x="8" y="14" font-family="Space Grotesk Variable, sans-serif" font-size="10" fill="var(--ink)">{{ centre }}: cx, cy</text>
    <text x="8" y="142" font-family="Space Grotesk Variable, sans-serif" font-size="10" fill="var(--ink)">{{ radius }}: r</text>
  </svg>
</template>
