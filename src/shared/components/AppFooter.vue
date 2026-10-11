<script lang="ts">
import { defineComponent } from 'vue'
import { APP_NAME } from '../config'
import Icon from './Icon.vue'

export const REPO_URL = 'https://github.com/wi-wissen/flexdraw'

// Footer links shared by the help and credits pages (pages live one folder below the root).
export default defineComponent({
  name: 'AppFooter',
  components: { Icon },
  data() {
    return { appName: APP_NAME, repoUrl: REPO_URL }
  },
})
</script>

<template>
  <footer class="fd-footer">
    <span class="font-bold">{{ appName }}</span>
    <nav class="flex flex-wrap gap-3" :aria-label="$t('common.footer')">
      <a class="nb-btn" href="../help/"><Icon name="help" />{{ $t('common.help') }}</a>
      <a class="nb-btn" href="../credits/"><Icon name="heart" />{{ $t('common.credits') }}</a>
      <a class="nb-btn" :href="repoUrl" target="_blank" rel="noopener noreferrer"><Icon name="github" />{{ $t('common.github') }}</a>
    </nav>
  </footer>
</template>
