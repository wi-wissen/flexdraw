<script lang="ts">
import { defineComponent } from 'vue'
import Icon from '../../shared/components/Icon.vue'
import { modName } from '../keys'

// Top action bar: New, Open, Download, Undo, Redo. Disabled buttons stay visible and say why.
export default defineComponent({
  name: 'ActionBar',
  components: { Icon },
  props: {
    canUndo: { type: Boolean, required: true },
    canRedo: { type: Boolean, required: true },
    canExport: { type: Boolean, required: true },
  },
  emits: ['new', 'open', 'download', 'undo', 'redo'],
  computed: {
    mod(): string {
      return modName(this.$i18n.locale)
    },
  },
})
</script>

<template>
  <div class="flex flex-wrap items-center gap-3 border-b-2 border-ink bg-panel px-4 py-2" role="toolbar" :aria-label="$t('app.actions.label')">
    <button type="button" class="nb-btn" data-testid="act-new" :title="$t('app.actions.newTip')" @click="$emit('new')"><Icon name="new" />{{ $t('app.actions.new') }}</button>
    <button type="button" class="nb-btn" data-testid="act-open" :title="$t('app.actions.openTip')" @click="$emit('open')"><Icon name="open" />{{ $t('app.actions.open') }}</button>
    <button
      type="button" class="nb-btn is-primary" data-testid="act-download" :aria-disabled="!canExport"
      :title="canExport ? `${$t('app.actions.downloadTip')} (${mod}+S)` : $t('app.actions.downloadEmpty')"
      @click="canExport && $emit('download')"
    ><Icon name="download" />{{ $t('app.actions.download') }}</button>
    <span class="mx-1 h-6 w-0.5 bg-ink" aria-hidden="true" />
    <button
      type="button" class="nb-btn" data-testid="act-undo" :aria-disabled="!canUndo"
      :title="canUndo ? `${$t('app.actions.undo')} (${mod}+Z)` : $t('app.actions.undoNone')" @click="canUndo && $emit('undo')"
    ><Icon name="undo" />{{ $t('app.actions.undo') }}</button>
    <button
      type="button" class="nb-btn" data-testid="act-redo" :aria-disabled="!canRedo"
      :title="canRedo ? `${$t('app.actions.redo')} (${mod}+Y)` : $t('app.actions.redoNone')" @click="canRedo && $emit('redo')"
    ><Icon name="redo" />{{ $t('app.actions.redo') }}</button>
  </div>
</template>
