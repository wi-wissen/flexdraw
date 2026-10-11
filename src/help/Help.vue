<script lang="ts">
import { defineComponent } from 'vue'
import AppHeader from '../shared/components/AppHeader.vue'

// Stub: the help package replaces this page.
export default defineComponent({ name: 'HelpPage', components: { AppHeader } })
</script>

<template>
  <AppHeader current="help" />
  <main class="p-8"><h1 class="text-3xl font-bold">{{ $t('help.title') }}</h1></main>
</template>
