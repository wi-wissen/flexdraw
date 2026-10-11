<script lang="ts">
import { defineComponent } from 'vue'
import { ICONS } from '../icons'

export default defineComponent({
  name: 'FdIcon',
  props: { name: { type: String, required: true } },
  computed: {
    paths(): string[] {
      return ICONS[this.name] ?? []
    },
  },
})
</script>

<template>
  <svg class="fd-icon" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor"
    stroke-width="1.75" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true" focusable="false">
    <path v-for="(d, i) in paths" :key="i" :d="d" />
  </svg>
</template>
