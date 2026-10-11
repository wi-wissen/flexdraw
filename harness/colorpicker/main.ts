// Dev-only harness for the ColorPicker work package. Not part of the build.
import { defineComponent, h } from 'vue'
import ColorPicker from '../../src/app/components/ColorPicker.vue'
import { mountPage } from '../../src/shared/mount'

const Harness = defineComponent({
  data() {
    return { fill: '#3b82f6', stroke: 'none' }
  },
  render() {
    return h('main', { style: 'padding: 1rem; display: flex; gap: 2rem; flex-wrap: wrap;' }, [
      h(ColorPicker, {
        label: 'Füllung',
        modelValue: this.fill,
        'onUpdate:modelValue': (v: string) => (this.fill = v),
      }),
      h(ColorPicker, {
        label: 'Kontur',
        modelValue: this.stroke,
        'onUpdate:modelValue': (v: string) => (this.stroke = v),
      }),
    ])
  },
})

mountPage(Harness)
