<script lang="ts">
import { defineComponent } from 'vue'
import AppHeader from '../shared/components/AppHeader.vue'
import StepPic from './illustrations/StepPic.vue'
import ToolPic from './illustrations/ToolPic.vue'
import BoolPic from './illustrations/BoolPic.vue'
import SmileyPic from './illustrations/SmileyPic.vue'

// Source text of the example. It is code, not UI text, so it stays here.
const SVG_SOURCE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 140 140" width="140" height="140">
  <circle cx="60" cy="60" r="50" fill="#ffc93c" stroke="#0f172a" stroke-width="4" />
  <ellipse cx="42" cy="46" rx="6" ry="10" fill="#0f172a" />
  <ellipse cx="78" cy="46" rx="6" ry="10" fill="#0f172a" />
  <path d="M 32 68 A 28 22 0 0 0 88 68 Z" fill="#ff6b6b" stroke="#0f172a" stroke-width="3" />
</svg>`

export default defineComponent({
  name: 'HelpPage',
  components: { AppHeader, StepPic, ToolPic, BoolPic, SmileyPic },
  data() {
    return {
      svgSource: SVG_SOURCE,
      tocIds: ['start', 'tools', 'combine', 'svg', 'shortcuts'],
      stepKeys: ['draw', 'select', 'colour', 'save'],
      toolKeys: ['select', 'rect', 'ellipse', 'polygon', 'freehand', 'pan', 'zoom'],
      opKeys: ['unite', 'intersect', 'subtract', 'exclude'],
      shortcutRows: [
        { keys: ['ctrl', 'z'], action: 'undo' },
        { keys: ['ctrl', 'y'], action: 'redo' },
        { keys: ['shift', 'ctrl', 'z'], action: 'redo' },
        { keys: ['ctrl', 'c'], action: 'copy' },
        { keys: ['ctrl', 'v'], action: 'paste' },
        { keys: ['ctrl', 'd'], action: 'duplicate' },
        { keys: ['ctrl', 'a'], action: 'selectAll' },
        { keys: ['esc'], action: 'deselect' },
        { keys: ['del'], action: 'delete' },
        { keys: ['backspace'], action: 'backspaceDelete' },
        { keys: ['arrows'], action: 'move' },
        { keys: ['ctrl', 's'], action: 'save' },
      ],
    }
  },
  methods: {
    keyLabel(key: string): string {
      return key.length === 1 ? key.toUpperCase() : this.$t('help.shortcuts.keyNames.' + key)
    },
  },
})
</script>

<template>
  <AppHeader current="help" />
  <a class="help-skip" href="#help-main">{{ $t('common.skip') }}</a>
  <main id="help-main" class="help-main">
    <header class="help-intro">
      <h1>{{ $t('help.title') }}</h1>
      <p>{{ $t('help.intro') }}</p>
    </header>

    <nav class="nb-panel help-toc" aria-labelledby="help-toc-label">
      <p id="help-toc-label" class="help-toc-label">{{ $t('help.toc.label') }}</p>
      <ol>
        <li v-for="id in tocIds" :key="id">
          <a :href="'#' + id">{{ $t('help.toc.' + id) }}</a>
        </li>
      </ol>
    </nav>

    <section id="start" class="nb-panel help-card" aria-labelledby="start-title">
      <h2 id="start-title">{{ $t('help.start.title') }}</h2>
      <ol class="help-steps">
        <li v-for="k in stepKeys" :key="k" class="help-step">
          <StepPic :name="k" :label="$t('help.start.steps.' + k + '.alt')" />
          <h3>{{ $t('help.start.steps.' + k + '.title') }}</h3>
          <p>{{ $t('help.start.steps.' + k + '.text') }}</p>
        </li>
      </ol>
    </section>

    <section id="tools" class="nb-panel help-card" aria-labelledby="tools-title">
      <h2 id="tools-title">{{ $t('help.tools.title') }}</h2>
      <ul class="help-tools">
        <li v-for="k in toolKeys" :key="k" class="help-tool">
          <ToolPic :name="k" :label="$t('help.tools.items.' + k + '.alt')" />
          <div>
            <h3>{{ $t('help.tools.items.' + k + '.name') }}</h3>
            <p>{{ $t('help.tools.items.' + k + '.text') }}</p>
          </div>
        </li>
      </ul>
    </section>

    <section id="combine" class="nb-panel help-card" aria-labelledby="combine-title">
      <h2 id="combine-title">{{ $t('help.combine.title') }}</h2>
      <p>{{ $t('help.combine.intro') }}</p>
      <ul class="help-ops">
        <li v-for="k in opKeys" :key="k" class="help-op">
          <h3>{{ $t('help.combine.ops.' + k + '.name') }}</h3>
          <p>{{ $t('help.combine.ops.' + k + '.text') }}</p>
          <BoolPic
            :op="k"
            :before-label="$t('help.combine.before')"
            :after-label="$t('help.combine.ops.' + k + '.alt')"
          />
        </li>
      </ul>
      <aside class="help-teacher" aria-labelledby="teacher-title">
        <h3 id="teacher-title">{{ $t('help.combine.teacher.title') }}</h3>
        <p>{{ $t('help.combine.teacher.text') }}</p>
        <ul>
          <li v-for="(item, i) in $tm('help.combine.teacher.items')" :key="i">{{ item }}</li>
        </ul>
      </aside>
    </section>

    <section id="svg" class="nb-panel help-card" aria-labelledby="svg-title">
      <h2 id="svg-title">{{ $t('help.svg.title') }}</h2>
      <p>{{ $t('help.svg.text') }}</p>
      <div class="help-svg-row">
        <figure class="help-figure">
          <SmileyPic :label="$t('help.svg.alt')" />
        </figure>
        <div class="help-code-wrap">
          <p>{{ $t('help.svg.codeLabel') }}</p>
          <pre class="help-code" tabindex="0"><code>{{ svgSource }}</code></pre>
        </div>
      </div>
    </section>

    <section id="shortcuts" class="nb-panel help-card" aria-labelledby="shortcuts-title">
      <h2 id="shortcuts-title">{{ $t('help.shortcuts.title') }}</h2>
      <div class="help-table-wrap" tabindex="0">
        <table class="help-table">
          <caption>{{ $t('help.shortcuts.caption') }}</caption>
          <thead>
            <tr>
              <th scope="col">{{ $t('help.shortcuts.colKey') }}</th>
              <th scope="col">{{ $t('help.shortcuts.colAction') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in shortcutRows" :key="i">
              <th scope="row">
                <span class="help-keys">
                  <template v-for="(key, j) in row.keys" :key="j">
                    <span v-if="j > 0" aria-hidden="true">+</span>
                    <kbd>{{ keyLabel(key) }}</kbd>
                  </template>
                </span>
              </th>
              <td>{{ $t('help.shortcuts.rows.' + row.action) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>{{ $t('help.shortcuts.mac') }}</p>
    </section>
  </main>
</template>

<style scoped>
.help-skip {
  position: absolute;
  left: -9999px;
  top: 0;
}
.help-skip:focus {
  left: 0.5rem;
  top: 0.5rem;
  z-index: 10;
  padding: 0.4rem 0.7rem;
  background: #ffc93c;
  color: #0f172a;
  border: 2px solid #0f172a;
}

.help-main {
  box-sizing: border-box;
  max-width: 48rem;
  margin: 0 auto;
  padding: 1.25rem 1rem 3rem;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.5rem;
}
.help-main h1 {
  margin: 0.25rem 0 0.5rem;
  font-size: clamp(2rem, 6vw, 2.75rem);
  font-weight: 800;
  line-height: 1.1;
}
.help-intro p {
  margin: 0;
  font-size: 1.05rem;
}

.help-toc {
  padding: 1rem 1.25rem;
}
.help-toc-label {
  margin: 0 0 0.4rem;
  font-weight: 700;
}
.help-toc ol {
  margin: 0;
  padding-left: 1.25rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 0.3rem 1rem;
}
.help-toc a {
  color: var(--ink);
  font-weight: 600;
  text-decoration-thickness: 2px;
}

.help-card {
  box-sizing: border-box;
  padding: 1.25rem;
  min-width: 0;
  scroll-margin-top: 1rem;
}
.help-card h2 {
  margin: 0 0 0.75rem;
  font-size: 1.6rem;
  font-weight: 800;
}
.help-card h3 {
  margin: 0.25rem 0;
  font-size: 1.1rem;
  font-weight: 700;
}
.help-card p {
  margin: 0.25rem 0 0.5rem;
  line-height: 1.5;
}

.help-steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
  gap: 1rem;
}
.help-step {
  min-width: 0;
  text-align: center;
}

.help-tools,
.help-ops {
  list-style: none;
  margin: 0;
  padding: 0;
}
.help-tool {
  display: grid;
  grid-template-columns: minmax(0, 9rem) minmax(0, 1fr);
  gap: 1rem;
  align-items: center;
  padding: 0.85rem 0;
  border-top: 2px solid var(--ink);
}
.help-tool:first-child {
  border-top: 0;
  padding-top: 0;
}
.help-tool h3,
.help-tool p {
  margin: 0.15rem 0;
}
@media (max-width: 30rem) {
  .help-tool {
    grid-template-columns: minmax(0, 1fr);
  }
}

.help-op {
  padding: 0.85rem 0;
  border-top: 2px solid var(--ink);
}
.help-op:first-child {
  border-top: 0;
  padding-top: 0;
}

.help-teacher {
  margin-top: 1.25rem;
  padding: 1rem 1.25rem;
  background: #ffc93c;
  color: #0f172a;
  border: 2px solid #0f172a;
  box-shadow: 4px 4px 0 var(--shadow);
}
.help-teacher h3 {
  margin-top: 0;
}
.help-teacher p,
.help-teacher ul {
  margin: 0.25rem 0 0.5rem;
}
.help-teacher ul {
  padding-left: 1.25rem;
}
.help-teacher li {
  margin: 0.2rem 0;
}

.help-figure {
  margin: 0;
  padding: 1rem;
  background: var(--bg);
  border: 2px solid var(--ink);
  box-shadow: 4px 4px 0 var(--shadow);
  max-width: 100%;
  box-sizing: border-box;
}
.help-svg-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 1.25rem;
  align-items: start;
}
.help-code-wrap {
  min-width: 0;
}
.help-code {
  margin: 0;
  padding: 0.75rem 1rem;
  overflow-x: auto;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  line-height: 1.5;
  background: #0f172a;
  color: #e2e8f0;
  border: 2px solid var(--ink);
  box-shadow: 4px 4px 0 var(--shadow);
}
@media (max-width: 36rem) {
  .help-svg-row {
    grid-template-columns: minmax(0, 1fr);
  }
}

.help-table-wrap {
  overflow-x: auto;
}
.help-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}
.help-table caption {
  text-align: left;
  font-weight: 700;
  padding-bottom: 0.5rem;
}
.help-table th,
.help-table td {
  padding: 0.45rem 0.6rem;
  border: 2px solid var(--ink);
  text-align: left;
  vertical-align: top;
}
.help-table thead th {
  background: var(--bg);
}
.help-table tbody th {
  font-weight: 600;
  white-space: nowrap;
}
.help-keys {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
}
.help-table kbd {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  padding: 0.05rem 0.35rem;
  background: var(--panel);
  color: var(--ink);
  border: 2px solid var(--ink);
  box-shadow: 2px 2px 0 var(--shadow);
}
</style>
