<script lang="ts">
import { defineComponent } from 'vue'
import Icon from '../../shared/components/Icon.vue'

export const TOOLS = ['select', 'rect', 'ellipse', 'polygon', 'freehand'] as const

// Left tool bar. The active tool is marked by fill, inner frame AND aria-pressed (not colour alone).
export default defineComponent({
  name: 'ToolPalette',
  components: { Icon },
  props: { tool: { type: String, required: true } },
  emits: ['update:tool'],
  data() {
    return { tools: TOOLS }
  },
})
</script>

<template>
  <div class="flex flex-col gap-3 border-r-2 border-ink bg-panel p-2" role="toolbar" aria-orientation="vertical" :aria-label="$t('app.tools.label')">
    <button
      v-for="t in tools" :key="t" type="button" class="nb-btn" :class="{ 'is-active': tool === t }"
      :data-testid="`tool-${t}`" :aria-pressed="tool === t" :title="$t('app.hint.' + t)" @click="$emit('update:tool', t)"
    >
      <Icon :name="t" />{{ $t('app.tools.' + t) }}
      <Icon name="check" class="ml-auto" :class="{ invisible: tool !== t }" />
    </button>
  </div>
</template>
