<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import type { Editor } from '../../core/editor'
import type { BooleanOp, Reorder } from '../../core/types'
import Icon from '../../shared/components/Icon.vue'
import ColorPicker from './ColorPicker.vue'

const ORDER: Reorder[] = ['front', 'forward', 'backward', 'back']
const OPS: BooleanOp[] = ['unite', 'intersect', 'subtract', 'exclude']

// Right panel: fill, stroke, stroke width, selection actions, order, combine (boolean).
export default defineComponent({
  name: 'PropertiesPanel',
  components: { Icon, ColorPicker },
  props: {
    editor: { type: Object as PropType<Editor>, required: true },
    rev: { type: Number, required: true },
  },
  data() {
    return { order: ORDER, ops: OPS }
  },
  computed: {
    style() {
      void this.rev
      return this.editor.shownStyle
    },
    hasSelection(): boolean {
      void this.rev
      return this.editor.selection.length > 0
    },
    canBoolean(): boolean {
      void this.rev
      return this.editor.canBoolean
    },
  },
  methods: {
    onWidth(e: Event) {
      const v = Math.max(0, Math.min(200, Math.round(Number((e.target as HTMLInputElement).value))))
      if (Number.isFinite(v)) this.editor.setStyle({ strokeWidth: v })
    },
  },
})
</script>

<template>
  <aside class="flex w-72 flex-none flex-col gap-4 overflow-y-auto border-l-2 border-ink bg-panel p-3" :aria-label="$t('app.props.label')">
    <section class="flex flex-col gap-2" :aria-label="$t('app.props.selection')">
      <h2 class="font-bold">{{ $t('app.props.selection') }}</h2>
      <div class="flex flex-wrap gap-2">
        <button type="button" class="nb-btn" data-testid="act-duplicate" :aria-disabled="!hasSelection" :title="hasSelection ? $t('app.props.duplicate') + ' (Ctrl+D)' : $t('app.props.selectFirst')" @click="hasSelection && editor.duplicate()"><Icon name="duplicate" />{{ $t('app.props.duplicate') }}</button>
        <button type="button" class="nb-btn is-danger" data-testid="act-delete" :aria-disabled="!hasSelection" :title="hasSelection ? $t('app.props.delete') + ' (Del)' : $t('app.props.selectFirst')" @click="hasSelection && editor.deleteSelection()"><Icon name="trash" />{{ $t('app.props.delete') }}</button>
      </div>
    </section>

    <section class="flex flex-col gap-2" :aria-label="$t('app.props.order')">
      <h2 class="font-bold">{{ $t('app.props.order') }}</h2>
      <div class="grid grid-cols-2 gap-2">
        <button v-for="o in order" :key="o" type="button" class="nb-btn" :data-testid="`order-${o}`" :aria-disabled="!hasSelection" :title="hasSelection ? $t('app.props.' + o) : $t('app.props.selectFirst')" @click="hasSelection && editor.reorder(o)"><Icon :name="o" />{{ $t('app.props.' + o) }}</button>
      </div>
    </section>

    <section class="flex flex-col gap-2" :aria-label="$t('app.props.combine')">
      <h2 class="font-bold">{{ $t('app.props.combine') }}</h2>
      <div class="grid grid-cols-1 gap-2">
        <button v-for="op in ops" :key="op" type="button" class="nb-btn" :data-testid="`op-${op}`" :aria-disabled="!canBoolean" :title="canBoolean ? $t('app.props.' + op + 'Tip') : $t('app.props.needTwo')" @click="canBoolean && editor.applyBoolean(op)"><Icon :name="op" />{{ $t('app.props.' + op) }}</button>
      </div>
    </section>
    <ColorPicker :label="$t('app.props.fill')" :model-value="style.fill" @update:model-value="editor.setStyle({ fill: $event })" />
    <ColorPicker :label="$t('app.props.stroke')" :model-value="style.stroke" @update:model-value="editor.setStyle({ stroke: $event })" />
    <label class="flex items-center gap-2 font-semibold">
      {{ $t('app.props.strokeWidth') }}
      <input type="number" min="0" max="200" step="1" class="nb-input w-20" data-testid="stroke-width" :value="style.strokeWidth" @change="onWidth" />
    </label>

  </aside>
</template>
