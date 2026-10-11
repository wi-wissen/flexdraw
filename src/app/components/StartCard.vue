<script lang="ts">
import { defineComponent } from 'vue'
import Icon from '../../shared/components/Icon.vue'
import { APP_NAME } from '../../shared/config'

// Shown centred on an empty drawing; blocks nothing outside itself, can be closed.
export default defineComponent({
  name: 'StartCard',
  components: { Icon },
  emits: ['empty', 'smiley', 'open', 'close'],
  data() {
    return { appName: APP_NAME }
  },
})
</script>

<template>
  <div class="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
    <section class="nb-panel pointer-events-auto flex max-w-sm flex-col gap-3 p-4" data-testid="start-card" aria-labelledby="start-title">
      <div class="flex items-start justify-between gap-2">
        <h2 id="start-title" class="text-xl font-extrabold">{{ $t('app.start.title', { name: appName }) }}</h2>
        <button type="button" class="nb-btn" data-testid="start-close" @click="$emit('close')"><Icon name="close" />{{ $t('app.start.close') }}</button>
      </div>
      <p>{{ $t('app.start.text') }}</p>
      <button type="button" class="nb-btn" data-testid="start-empty" @click="$emit('empty')"><Icon name="rect" />{{ $t('app.start.empty') }}</button>
      <button type="button" class="nb-btn is-primary" data-testid="start-smiley" @click="$emit('smiley')"><Icon name="smiley" />{{ $t('app.start.smiley') }}</button>
      <button type="button" class="nb-btn" data-testid="start-open" @click="$emit('open')"><Icon name="open" />{{ $t('app.start.open') }}</button>
    </section>
  </div>
</template>
