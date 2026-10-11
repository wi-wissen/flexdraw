<script lang="ts">
import { defineComponent } from 'vue'
import AppHeader from '../shared/components/AppHeader.vue'
import Icon from '../shared/components/Icon.vue'
import { APP_NAME } from '../shared/config'

// Placeholder landing page (first iteration): name, tagline, link to the app.
export default defineComponent({
  name: 'LandingPage',
  components: { AppHeader, Icon },
  data() {
    return { appName: APP_NAME }
  },
})
</script>

<template>
  <AppHeader current="home" />
  <main class="mx-auto max-w-2xl p-8">
    <h1 class="text-4xl font-extrabold">{{ appName }}</h1>
    <p class="my-4 text-lg">{{ $t('landing.intro') }}</p>
    <a class="nb-btn is-primary" href="./app/"><Icon name="rect" />{{ $t('landing.start') }}</a>
  </main>
</template>
