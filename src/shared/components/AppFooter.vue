<script lang="ts">
import { defineComponent } from 'vue'
import { APP_NAME } from '../config'
import Icon from './Icon.vue'

export const REPO_URL = 'https://github.com/wi-wissen/flexdraw'

// The one footer for every page. `base` is the path from the page to the site root:
// "./" on the landing page, "../" on pages one folder below it.
export default defineComponent({
  name: 'AppFooter',
  components: { Icon },
  props: { base: { type: String, default: '../' } },
  data() {
    return { appName: APP_NAME, repoUrl: REPO_URL }
  },
})
</script>

<template>
  <footer class="fd-footer">
    <div class="fd-footer-inner">
      <div>
        <p class="fd-footer-brand">{{ appName }}</p>
        <p>{{ $t('common.footerAbout') }}</p>
        <p class="fd-footer-small">{{ $t('common.footerSource') }} · {{ $t('common.footerMade') }}</p>
      </div>
      <nav class="fd-footer-links" :aria-label="$t('common.footer')">
        <a class="nb-btn" :href="base + 'help/'"><Icon name="help" />{{ $t('common.help') }}</a>
        <a class="nb-btn" :href="base + 'credits/'" data-testid="footer-credits"><Icon name="heart" />{{ $t('common.credits') }}</a>
        <a class="nb-btn" :href="repoUrl" target="_blank" rel="noopener noreferrer" data-testid="footer-github">
          <Icon name="github" />{{ $t('common.github') }}<span class="sr-only"> {{ $t('common.newTab') }}</span>
        </a>
      </nav>
    </div>
  </footer>
</template>
