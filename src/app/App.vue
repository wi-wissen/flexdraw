<script lang="ts">
import { defineComponent } from 'vue'
import AppHeader from '../shared/components/AppHeader.vue'

// Placeholder shell; the tech lead replaces this with the real editor.
export default defineComponent({ name: 'App', components: { AppHeader } })
</script>

<template>
  <AppHeader current="app" />
  <main class="p-8">Flex Draw</main>
</template>
