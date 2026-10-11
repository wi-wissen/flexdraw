import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'

// Flat config. TypeScript everywhere; .vue files use vue-eslint-parser with the
// TypeScript parser for <script lang="ts">.
export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'screenshots/**', 'test-results/**', 'playwright-report/**', '.claude/**'],
  },
  tseslint.configs.recommended,
  pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser, extraFileExtensions: ['.vue'] },
    },
    rules: {
      // CLAUDE.md: Vue 3 Options API only. Forbid <script setup> and the Composition API.
      'vue/component-api-style': ['error', ['options']],
      // Turned off: pure whitespace layout rules that fight the compact markup in the
      // existing components. There is no Prettier in this repo, so they only add noise.
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-indent': 'off',
      'vue/first-attribute-linebreak': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'vue',
              importNames: [
                'ref', 'reactive', 'computed', 'watch', 'watchEffect', 'shallowRef', 'readonly',
                'toRef', 'toRefs', 'provide', 'inject', 'onMounted', 'onUnmounted', 'onBeforeUnmount',
                'useTemplateRef',
              ],
              message: 'Options API only (CLAUDE.md): use defineComponent with data/computed/methods.',
            },
          ],
        },
      ],
    },
  },
  {
    // Turned down to a warning: the remaining `any` casts sit where vue-i18n and Paper.js
    // have no usable typings (src/shared/i18n.ts, AppHeader.vue, tests). Reported, not hidden.
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
)
