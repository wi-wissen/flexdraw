<script lang="ts">
import { defineComponent } from 'vue'
import { ICONS } from '../../shared/icons'

// Landing-only icons on the same 16x16 stroke grid as the shared set (src/shared/icons.ts).
// Unknown names fall back to the shared icons. Rendered as path elements with v-for.
const LOCAL: Record<string, string[]> = {
  // GitHub-style cat head with ears, whiskers-free, plus the tail.
  github: ['M4 6.5V2l2.5 2h3L12 2v4.5c1 1.5.5 4-2 4.5H6c-2.5-.5-3-3-2-4.5z', 'M6.5 11v3.5M9.5 11v3.5', 'M6.5 12.5C4.5 13 3.5 12 3 11'],
  play: ['M4 2.5l9 5.5-9 5.5z'],
  pause: ['M4 2.5h2.5v11H4zM9.5 2.5H12v11H9.5z'],
  arrow: ['M2 8h11', 'M9 4l4 4-4 4'],
  external: ['M9 2h5v5', 'M14 2L7.5 8.5', 'M12 10v4H2V4h4'],
  user: ['M8 2a3 3 0 100 6 3 3 0 000-6z', 'M2.5 14c.5-3 2.5-4.5 5.5-4.5s5 1.5 5.5 4.5', 'M2 2l12 12'],
  server: ['M2 2.5h12v4H2zM2 9.5h12v4H2z', 'M4.5 4.5h1M4.5 11.5h1', 'M1 1l14 14'],
  eye: ['M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z', 'M8 6a2 2 0 100 4 2 2 0 000-4z', 'M2 14L14 2'],
  offline: ['M2 6c3.5-3 8.5-3 12 0', 'M4 8.5c2.5-2 5.5-2 8 0', 'M6.5 11c1-.7 2-.7 3 0', 'M8 13.5v.5'],
  heart: ['M8 14S2 10 2 6a3 3 0 016-1 3 3 0 016 1c0 4-6 8-6 8z'],
  school: ['M1 6l7-3.5L15 6 8 9.5z', 'M4 7.5V11c2.5 2 5.5 2 8 0V7.5', 'M15 6v5'],
  kid: ['M8 2a3 3 0 100 6 3 3 0 000-6z', 'M6.5 5h.1M9.5 5h.1', 'M4 14v-3a4 4 0 018 0v3'],
  tablet: ['M3.5 1.5h9v13h-9z', 'M7 12.5h2'],
  sparkle: ['M8 1v4M8 11v4M1 8h4M11 8h4', 'M4 4l1.5 1.5M10.5 10.5L12 12M12 4l-1.5 1.5M5.5 10.5L4 12'],
  credits: ['M8 1.5l1.9 4 4.3.5-3.2 3 .9 4.3L8 11.1 4.1 13.3l.9-4.3-3.2-3 4.3-.5z'],
  file: ['M3 1.5h7l3 3v10H3z', 'M10 1.5v3h3', 'M5.5 9L4 10.5 5.5 12M10.5 9l1.5 1.5-1.5 1.5'],
}

export default defineComponent({
  name: 'LpIcon',
  props: {
    name: { type: String, required: true },
    size: { type: Number, default: 16 },
  },
  computed: {
    paths(): string[] {
      return LOCAL[this.name] ?? ICONS[this.name] ?? []
    },
  },
})
</script>

<template>
  <svg class="fd-icon" viewBox="0 0 16 16" :width="size" :height="size" fill="none" stroke="currentColor"
    stroke-width="1.75" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true" focusable="false">
    <path v-for="(d, i) in paths" :key="i" :d="d" />
  </svg>
</template>
