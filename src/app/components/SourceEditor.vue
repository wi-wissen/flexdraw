<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import type { SvgError } from '../../core/types'

// STUB – replaced by the source-editor work package. Contract:
//   props: modelValue (string, the SVG text to show), error (SvgError | null)
//   emits: edit(text) – debounced 300 ms after the user stops typing; never emitted for
//          prop-driven changes of modelValue.
export default defineComponent({
  name: 'SourceEditor',
  props: {
    modelValue: { type: String, required: true },
    error: { type: Object as PropType<SvgError | null>, default: null },
  },
  emits: ['edit'],
})
</script>

<template>
  <pre>{{ modelValue }}</pre>
</template>
