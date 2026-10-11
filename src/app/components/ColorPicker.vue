<script lang="ts">
import { defineComponent } from 'vue'
import FdIcon from '../../shared/components/Icon.vue'
import { PALETTE, SHADES, BLACK, WHITE } from '../../core/palette'
import { normalizeHex } from '../../core/color'

// Colour picker for one fill or stroke. Contract:
//   props: label (string), modelValue (string: "#rrggbb" or "none"), allowNone (boolean, default true)
//   emits: update:modelValue with a lowercase 6-digit hex or "none"
let instances = 0

export default defineComponent({
  name: 'ColorPicker',
  components: { FdIcon },
  props: {
    label: { type: String, required: true },
    modelValue: { type: String, required: true },
    allowNone: { type: Boolean, default: true },
  },
  emits: ['update:modelValue'],
  data() {
    instances += 1
    return {
      uid: instances,
      draft: this.modelValue === 'none' ? '' : this.modelValue,
      hexError: false,
    }
  },
  computed: {
    palette() {
      return PALETTE
    },
    shades() {
      return SHADES
    },
    black() {
      return BLACK
    },
    white() {
      return WHITE
    },
    isNone(): boolean {
      return this.modelValue === 'none'
    },
    labelId(): string {
      return `cp-label-${this.uid}`
    },
    hexId(): string {
      return `cp-hex-${this.uid}`
    },
    errorId(): string {
      return `cp-error-${this.uid}`
    },
  },
  watch: {
    modelValue(v: string) {
      this.draft = v === 'none' ? '' : v
      this.hexError = false
    },
  },
  methods: {
    isSelected(hex: string): boolean {
      return this.modelValue === hex
    },
    swatchName(family: string, shade: number | string): string {
      return this.$t('colors.swatch', { name: this.$t(`colors.family.${family}`), shade })
    },
    // Dark check mark on light swatches, light check mark on dark ones.
    checkColor(hex: string): string {
      const n = parseInt(hex.slice(1), 16)
      const lum = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)
      return lum > 150 ? '#0f172a' : '#ffffff'
    },
    pickSwatch(hex: string): void {
      this.hexError = false
      this.draft = hex
      this.$emit('update:modelValue', hex)
    },
    pickNone(): void {
      this.hexError = false
      this.draft = ''
      this.$emit('update:modelValue', 'none')
    },
    // Enter and blur both land here. Unchanged valid input emits nothing.
    commitHex(): void {
      const raw = this.draft.trim()
      if (raw === '') {
        this.hexError = false
        this.draft = this.isNone ? '' : this.modelValue
        return
      }
      const hex = normalizeHex(raw)
      if (hex === null) {
        this.hexError = true
        return
      }
      this.hexError = false
      this.draft = hex
      if (hex !== this.modelValue) this.$emit('update:modelValue', hex)
    },
  },
})
</script>

<template>
  <div class="cp" role="group" :aria-labelledby="labelId">
    <p :id="labelId" class="cp-label">{{ label }}</p>

    <div class="cp-extra">
      <button v-if="allowNone" type="button" class="nb-btn cp-none" data-testid="color-none"
        :aria-pressed="isNone ? 'true' : 'false'" :title="$t('colors.picker.none')"
        :aria-label="$t('colors.picker.none')" @click="pickNone">
        <FdIcon name="close" />
        <span>{{ $t('colors.picker.none') }}</span>
        <FdIcon v-if="isNone" name="check" />
      </button>
      <button type="button" class="cp-swatch" data-testid="swatch-black"
        :class="{ 'is-selected': isSelected(black) }" :aria-pressed="isSelected(black) ? 'true' : 'false'"
        :title="$t('colors.black')" :aria-label="$t('colors.black')"
        :style="{ background: black }" @click="pickSwatch(black)">
        <FdIcon v-if="isSelected(black)" name="check" :style="{ color: checkColor(black) }" />
      </button>
      <button type="button" class="cp-swatch" data-testid="swatch-white"
        :class="{ 'is-selected': isSelected(white) }" :aria-pressed="isSelected(white) ? 'true' : 'false'"
        :title="$t('colors.white')" :aria-label="$t('colors.white')"
        :style="{ background: white }" @click="pickSwatch(white)">
        <FdIcon v-if="isSelected(white)" name="check" :style="{ color: checkColor(white) }" />
      </button>
    </div>

    <div class="cp-grid" role="group" :aria-label="$t('colors.picker.palette')">
      <div v-for="fam in palette" :key="fam.family" class="cp-row">
        <button v-for="shade in shades" :key="shade" type="button" class="cp-swatch"
          :data-testid="`swatch-${fam.family}-${shade}`"
          :class="{ 'is-selected': isSelected(fam.hex[shade]) }"
          :aria-pressed="isSelected(fam.hex[shade]) ? 'true' : 'false'"
          :title="swatchName(fam.family, shade)" :aria-label="swatchName(fam.family, shade)"
          :style="{ background: fam.hex[shade] }" @click="pickSwatch(fam.hex[shade])">
          <FdIcon v-if="isSelected(fam.hex[shade])" name="check" :style="{ color: checkColor(fam.hex[shade]) }" />
        </button>
      </div>
    </div>

    <div class="cp-hex">
      <label :for="hexId" class="cp-hex-label">{{ $t('colors.picker.hex') }}</label>
      <input :id="hexId" v-model="draft" type="text" class="nb-input is-mono cp-input"
        data-testid="hex-input" autocomplete="off" spellcheck="false"
        :placeholder="$t('colors.picker.placeholder')"
        :aria-invalid="hexError ? 'true' : 'false'"
        :aria-describedby="hexError ? errorId : undefined"
        @input="hexError = false" @keydown.enter.prevent="commitHex" @blur="commitHex" />
      <p v-if="hexError" :id="errorId" role="alert" class="cp-error" data-testid="hex-error">
        {{ $t('colors.picker.hexError') }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.cp { display: grid; gap: 0.6rem; align-content: start; width: 100%; max-width: 280px; box-sizing: border-box; }
.cp-label { margin: 0; font-weight: 700; }
.cp-extra { display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: center; }
.cp-none[aria-pressed='true'] { border-width: 4px; }
.cp-none .fd-icon { width: 12px; height: 12px; }
.cp-grid { display: grid; grid-template-columns: repeat(2, max-content); gap: 0.4rem 0.6rem; justify-content: start; }
.cp-row { display: grid; grid-template-columns: repeat(5, 24px); gap: 2px; }
.cp-swatch {
  width: 24px; height: 24px; padding: 0; box-sizing: border-box; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  border: 2px solid var(--ink); background: transparent;
}
.cp-swatch.is-selected { border-width: 4px; }
.cp-swatch .fd-icon { width: 12px; height: 12px; stroke-width: 2.5; }
.cp-hex { display: grid; gap: 0.25rem; }
.cp-hex-label { font-weight: 600; }
.cp-input { width: 100%; box-sizing: border-box; }
.cp-error { margin: 0; padding: 0.25rem 0.5rem; border: 2px solid var(--ink); background: var(--danger); color: #0f172a; font-weight: 600; }
</style>
