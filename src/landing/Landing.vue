<script lang="ts">
import { defineComponent } from 'vue'
import AppHeader from '../shared/components/AppHeader.vue'
import Icon from '../shared/components/Icon.vue'
import { APP_NAME } from '../shared/config'

// Placeholder landing page: name, one line of intro, two links (app and help).
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
  <main class="mx-auto max-w-2xl px-4 py-6 sm:p-10">
    <section class="nb-panel p-6 sm:p-8">
      <h1 class="text-4xl leading-tight font-extrabold sm:text-5xl">{{ appName }}</h1>
      <p class="mt-4 mb-8 text-lg leading-snug">{{ $t('landing.intro') }}</p>
      <div class="flex flex-wrap gap-4">
        <a class="nb-btn is-primary px-4 py-2 text-lg" href="./app/"><Icon name="rect" />{{ $t('landing.start') }}</a>
        <a class="nb-btn px-4 py-2 text-lg" href="./help/"><Icon name="help" />{{ $t('landing.help') }}</a>
      </div>
    </section>
  </main>
</template>
