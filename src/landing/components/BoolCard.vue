<script lang="ts">
import { defineComponent } from 'vue'

let instances = 0

// One boolean operation as a tiny picture: square A and circle B, dashed inputs, solid result.
// Built with clip paths / masks / even-odd fill, so no path maths is needed.
export default defineComponent({
  name: 'BoolCard',
  props: {
    op: { type: String, required: true },
    label: { type: String, required: true },
    color: { type: String, default: 'var(--primary)' },
  },
  data() {
    instances += 1
    return { uid: `lp-bool-${instances}` }
  },
  computed: {
    circlePath(): string {
      return 'M28 44a22 22 0 1 0 44 0a22 22 0 1 0-44 0z'
    },
  },
})
</script>

<template>
  <svg class="lp-bool-svg" viewBox="0 0 80 72" role="img" :aria-label="label">
    <defs>
      <clipPath :id="uid + '-inA'"><rect x="8" y="8" width="40" height="40" /></clipPath>
      <clipPath :id="uid + '-inB'"><circle cx="50" cy="44" r="22" /></clipPath>
      <mask :id="uid + '-notB'" maskUnits="userSpaceOnUse" x="0" y="0" width="80" height="72">
        <rect x="0" y="0" width="80" height="72" fill="#ffffff" />
        <circle cx="50" cy="44" r="22" fill="#000000" />
      </mask>
    </defs>
    <!-- dashed inputs -->
    <rect x="8" y="8" width="40" height="40" fill="none" class="lp-bool-ghost" />
    <circle cx="50" cy="44" r="22" fill="none" class="lp-bool-ghost" />
    <g class="lp-bool-result" :style="{ '--c': color }">
      <template v-if="op === 'unite'">
        <rect x="8" y="8" width="40" height="40" class="is-fill is-stroke" />
        <circle cx="50" cy="44" r="22" class="is-fill is-stroke" />
        <rect x="9.5" y="9.5" width="37" height="37" class="is-fill" />
        <circle cx="50" cy="44" r="20.5" class="is-fill" />
      </template>
      <template v-else-if="op === 'intersect'">
        <rect x="8" y="8" width="40" height="40" class="is-fill is-stroke" :clip-path="`url(#${uid}-inB)`" />
        <circle cx="50" cy="44" r="22" class="is-stroke" fill="none" :clip-path="`url(#${uid}-inA)`" />
      </template>
      <template v-else-if="op === 'subtract'">
        <rect x="8" y="8" width="40" height="40" class="is-fill is-stroke" :mask="`url(#${uid}-notB)`" />
        <circle cx="50" cy="44" r="22" class="is-stroke" fill="none" :clip-path="`url(#${uid}-inA)`" />
      </template>
      <path v-else :d="'M8 8h40v40H8z' + circlePath" class="is-fill is-stroke" fill-rule="evenodd" />
    </g>
  </svg>
</template>
