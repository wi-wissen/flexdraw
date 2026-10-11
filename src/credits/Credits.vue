<script lang="ts">
import { defineComponent } from 'vue'
import AppFooter from '../shared/components/AppFooter.vue'
import AppHeader from '../shared/components/AppHeader.vue'
import { LIBRARIES } from './libraries'

export default defineComponent({
  name: 'CreditsPage',
  components: { AppHeader, AppFooter },
  data() {
    return {
      runtime: LIBRARIES.filter((l) => l.group === 'runtime'),
      dev: LIBRARIES.filter((l) => l.group === 'dev'),
    }
  },
})
</script>

<template>
  <AppHeader current="credits" />
  <main class="mx-auto flex max-w-3xl flex-col gap-6 p-4 sm:p-8">
    <h1 class="text-3xl font-extrabold">{{ $t('credits.title') }}</h1>
    <p>{{ $t('credits.intro') }}</p>

    <section class="nb-panel p-4" aria-labelledby="rt-title">
      <h2 id="rt-title" class="mb-3 text-xl font-bold">{{ $t('credits.runtime') }}</h2>
      <ul class="grid gap-3">
        <li v-for="l in runtime" :key="l.key" class="credit" :data-testid="`credit-${l.key}`">
          <a :href="l.url" target="_blank" rel="noopener noreferrer" class="font-bold">{{ l.name }}</a>
          <span class="credit-license">{{ l.license }}</span>
          <span class="credit-text">{{ $t('credits.libs.' + l.key) }}</span>
        </li>
      </ul>
    </section>

    <section class="nb-panel p-4" aria-labelledby="dev-title">
      <h2 id="dev-title" class="mb-3 text-xl font-bold">{{ $t('credits.dev') }}</h2>
      <ul class="grid gap-3">
        <li v-for="l in dev" :key="l.key" class="credit" :data-testid="`credit-${l.key}`">
          <a :href="l.url" target="_blank" rel="noopener noreferrer" class="font-bold">{{ l.name }}</a>
          <span class="credit-license">{{ l.license }}</span>
          <span class="credit-text">{{ $t('credits.libs.' + l.key) }}</span>
        </li>
      </ul>
    </section>

    <p>{{ $t('credits.thanks') }}</p>
  </main>
  <AppFooter />
</template>

<style scoped>
.credit { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 0.15rem 0.75rem; }
.credit a { color: var(--ink); text-decoration-thickness: 2px; }
.credit-license { font-family: var(--font-mono); font-size: 0.8rem; border: 2px solid var(--ink); padding: 0 0.4rem; align-self: start; background: var(--primary); color: #0f172a; }
.credit-text { grid-column: 1 / -1; }
</style>
