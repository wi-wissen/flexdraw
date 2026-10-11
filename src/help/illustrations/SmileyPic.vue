<script lang="ts">
import { defineComponent } from 'vue'

// The same drawing as the SVG source shown next to it on the help page.
export default defineComponent({
  name: 'SmileyPic',
  props: {
    label: { type: String, required: true },
  },
})
</script>

<template>
  <svg class="help-smiley" xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 140 140" width="140" height="140" role="img" :aria-label="label" focusable="false">
    <circle cx="60" cy="60" r="50" fill="#ffc93c" stroke="#0f172a" stroke-width="4" />
    <ellipse cx="42" cy="46" rx="6" ry="10" fill="#0f172a" />
    <ellipse cx="78" cy="46" rx="6" ry="10" fill="#0f172a" />
    <path d="M 32 68 A 28 22 0 0 0 88 68 Z" fill="#ff6b6b" stroke="#0f172a" stroke-width="3" />
  </svg>
</template>

<style scoped>
.help-smiley {
  display: block;
  width: 100%;
  max-width: 140px;
  height: auto;
}
</style>
