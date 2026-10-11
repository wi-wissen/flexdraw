<script lang="ts">
import { defineComponent } from 'vue'
import { APP_NAME } from '../config'
import { applyTheme, readTheme, saveTheme, type Theme } from '../theme'
import { setLang, type Lang } from '../i18n'
import Icon from './Icon.vue'

// Shared header. The app page puts its view switcher into the default slot.
export default defineComponent({
  name: 'AppHeader',
  components: { Icon },
  props: { current: { type: String, default: '' } },
  data() {
    return { appName: APP_NAME, theme: 'light' as Theme }
  },
  computed: {
    otherLang(): Lang {
      return this.$i18n.locale === 'de' ? 'en' : 'de'
    },
    otherTheme(): Theme {
      return this.theme === 'dark' ? 'light' : 'dark'
    },
  },
  mounted() {
    this.theme = readTheme()
    applyTheme(this.theme)
  },
  methods: {
    toggleLang() {
      setLang(this.$i18n as any, this.otherLang)
    },
    toggleTheme() {
      this.theme = this.otherTheme
      saveTheme(this.theme)
    },
  },
})
</script>

<template>
  <header class="fd-header">
    <a class="fd-brand" href="../" :aria-label="$t('common.home')">{{ appName }}</a>
    <div class="fd-header-mid"><slot /></div>
    <nav class="fd-header-end">
      <a v-if="current !== 'app'" class="nb-btn" href="../app/"><Icon name="rect" />{{ $t('common.app') }}</a>
      <a v-if="current !== 'help'" class="nb-btn" href="../help/"><Icon name="help" />{{ $t('common.help') }}</a>
      <button type="button" class="nb-btn" data-testid="lang-toggle" :title="$t('common.lang.switchTo', { name: $t('common.lang.' + otherLang) })" @click="toggleLang">
        <Icon name="globe" />{{ $t('common.lang.' + $i18n.locale) }}
      </button>
      <button type="button" class="nb-btn" data-testid="theme-toggle" :aria-pressed="theme === 'dark'" :title="$t('common.theme.label')" @click="toggleTheme">
        <Icon :name="theme === 'dark' ? 'moon' : 'sun'" />{{ $t('common.theme.' + theme) }}
      </button>
    </nav>
  </header>
</template>
