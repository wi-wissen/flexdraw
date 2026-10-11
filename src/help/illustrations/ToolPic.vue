<script lang="ts">
import { defineComponent } from 'vue'

// One small static picture per drawing tool. See StepPic.vue for the colour rules.
export default defineComponent({
  name: 'ToolPic',
  props: {
    name: { type: String, required: true },
    label: { type: String, required: true },
  },
})
</script>

<template>
  <svg class="help-pic" viewBox="0 0 120 80" role="img" :aria-label="label" focusable="false">
    <g v-if="name === 'select'" stroke-linejoin="round">
      <rect x="24" y="20" width="56" height="36" fill="#ffc93c" stroke="#0f172a" stroke-width="3" />
      <rect x="18" y="14" width="68" height="48" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="4 3" />
      <path d="M 78 44 L 78 70 L 85 63 L 92 78 L 97 75 L 90 60 L 99 60 Z" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
    </g>
    <g v-else-if="name === 'rect'">
      <rect x="22" y="18" width="64" height="40" fill="#ffc93c" stroke="#0f172a" stroke-width="3" />
      <circle cx="22" cy="18" r="4" fill="#ff6b6b" stroke="#0f172a" stroke-width="1.5" />
      <circle cx="86" cy="58" r="4" fill="#ff6b6b" stroke="#0f172a" stroke-width="1.5" />
    </g>
    <g v-else-if="name === 'ellipse'">
      <rect x="22" y="14" width="76" height="52" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="4 3" />
      <ellipse cx="60" cy="40" rx="36" ry="24" fill="#2ec4b6" stroke="#0f172a" stroke-width="3" />
    </g>
    <g v-else-if="name === 'polygon'" stroke-linejoin="round">
      <polyline points="22,66 40,18 74,14 98,46" fill="none" stroke="currentColor" stroke-width="2.5" />
      <path d="M 98 46 L 22 66" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="4 3" />
      <circle cx="22" cy="66" r="4.5" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
      <circle cx="40" cy="18" r="4.5" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
      <circle cx="74" cy="14" r="4.5" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
      <circle cx="98" cy="46" r="4.5" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
    </g>
    <g v-else-if="name === 'freehand'">
      <path d="M 14 60 C 30 10, 50 70, 66 30 S 96 16, 106 36" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" />
      <circle cx="14" cy="60" r="5" fill="#ff6b6b" stroke="#0f172a" stroke-width="1.5" />
    </g>
    <g v-else-if="name === 'pan'" stroke-linecap="square">
      <path d="M 60 22 V 58 M 42 40 H 78" fill="none" stroke="currentColor" stroke-width="3" />
      <path d="M 60 8 L 52 20 L 68 20 Z" fill="currentColor" />
      <path d="M 60 72 L 52 60 L 68 60 Z" fill="currentColor" />
      <path d="M 26 40 L 38 32 L 38 48 Z" fill="currentColor" />
      <path d="M 94 40 L 82 32 L 82 48 Z" fill="currentColor" />
    </g>
    <g v-else>
      <circle cx="52" cy="36" r="22" fill="#ffffff" stroke="#0f172a" stroke-width="3.5" />
      <path d="M 68 52 L 98 70" stroke="#0f172a" stroke-width="8" stroke-linecap="round" />
      <path d="M 42 36 H 62 M 52 26 V 46" stroke="#0f172a" stroke-width="3" stroke-linecap="square" />
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
