<script lang="ts">
import { defineComponent } from 'vue'

// STUB – replaced by the color-picker work package. Contract:
//   props: label (string), modelValue (string: "#rrggbb" or "none"), allowNone (boolean, default true)
//   emits: update:modelValue with a lowercase 6-digit hex or "none"
export default defineComponent({
  name: 'ColorPicker',
  props: {
    label: { type: String, required: true },
    modelValue: { type: String, required: true },
    allowNone: { type: Boolean, default: true },
  },
  emits: ['update:modelValue'],
})
</script>

<template>
  <div>{{ label }}: {{ modelValue }}</div>
</template>
