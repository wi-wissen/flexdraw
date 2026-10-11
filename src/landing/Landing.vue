<script lang="ts">
import { defineComponent } from 'vue'
import AppHeader from '../shared/components/AppHeader.vue'
import { APP_NAME } from '../shared/config'
import LpIcon from './components/LpIcon.vue'
import LiveDemo from './components/LiveDemo.vue'
import BgShapes from './components/BgShapes.vue'
import BoolCard from './components/BoolCard.vue'

export const GITHUB_URL = 'https://github.com/wi-wissen/flexdraw'

// Marquee words: the SVG term (code, not translated) and the translated meaning.
const MARQUEE = [
  { code: '<circle>', key: 'circle' },
  { code: '<rect>', key: 'rect' },
  { code: 'fill', key: 'fill' },
  { code: '<polygon>', key: 'polygon' },
  { code: 'stroke', key: 'stroke' },
  { code: '<path>', key: 'path' },
  { code: 'viewBox', key: 'viewBox' },
  { code: '<ellipse>', key: 'ellipse' },
  { code: 'stroke-width', key: 'strokeWidth' },
  { code: 'points', key: 'points' },
]

const REDUCE_QUERY = '(prefers-reduced-motion: reduce)'

type Media = { matches: boolean; addEventListener?: (t: 'change', cb: () => void) => void; removeEventListener?: (t: 'change', cb: () => void) => void }

export default defineComponent({
  name: 'LandingPage',
  components: { AppHeader, LpIcon, LiveDemo, BgShapes, BoolCard },
  data() {
    const words = APP_NAME.split(' ')
    return {
      githubUrl: GITHUB_URL,
      appName: APP_NAME,
      wordFirst: Array.from(words[0] ?? ''),
      wordRest: Array.from(words.slice(1).join(' ')),
      marquee: MARQUEE,
      ops: [
        { op: 'unite', color: 'var(--primary)' },
        { op: 'intersect', color: 'var(--danger)' },
        { op: 'subtract', color: 'var(--accent)' },
        { op: 'exclude', color: 'var(--primary)' },
      ],
      fileSteps: [
        { key: 'open', icon: 'open' },
        { key: 'edit', icon: 'freehand' },
        { key: 'save', icon: 'download' },
      ],
      privacyItems: [
        { key: 'account', icon: 'user', tone: 'is-yellow' },
        { key: 'server', icon: 'server', tone: 'is-teal' },
        { key: 'tracking', icon: 'eye', tone: 'is-coral' },
        { key: 'offline', icon: 'offline', tone: 'is-yellow' },
        { key: 'open', icon: 'heart', tone: 'is-teal' },
      ],
      schoolItems: [
        { key: 'kids', icon: 'kid' },
        { key: 'langs', icon: 'globe' },
        { key: 'touch', icon: 'tablet' },
        { key: 'help', icon: 'help' },
      ],
      reduced: false,
      paused: false,
      animReady: false,
      media: null as Media | null,
      observer: null as IntersectionObserver | null,
      raf: 0,
    }
  },
  mounted() {
    const media = (window.matchMedia?.(REDUCE_QUERY) ?? null) as Media | null
    this.media = media
    this.reduced = !!media?.matches
    this.paused = this.reduced
    media?.addEventListener?.('change', this.onMotionPref)
    this.setupReveal()
  },
  beforeUnmount() {
    this.media?.removeEventListener?.('change', this.onMotionPref)
    this.observer?.disconnect()
    if (this.raf) cancelAnimationFrame(this.raf)
  },
  methods: {
    onMotionPref() {
      this.reduced = !!this.media?.matches
      if (this.reduced) this.paused = true
    },
    toggleMotion() {
      this.paused = !this.paused
    },
    /** Sections stamp in when they scroll into view. Without IntersectionObserver or with
     *  reduced motion they are simply visible (the hidden state needs the lp-anim class). */
    setupReveal() {
      if (this.reduced || typeof IntersectionObserver === 'undefined') return
      const root = this.$el as HTMLElement
      const items = Array.from(root.querySelectorAll<HTMLElement>('.lp-reveal'))
      this.observer = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue
            e.target.classList.add('is-in')
            this.observer?.unobserve(e.target)
          }
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
      )
      for (const el of items) this.observer.observe(el)
      this.animReady = true
    },
    /** Pointer parallax for the floating hero shapes (mouse only, off when paused). */
    onPointer(e: PointerEvent) {
      if (this.paused || this.reduced || e.pointerType !== 'mouse' || this.raf) return
      const el = e.currentTarget as HTMLElement
      const x = e.clientX
      const y = e.clientY
      this.raf = requestAnimationFrame(() => {
        this.raf = 0
        const r = el.getBoundingClientRect()
        el.style.setProperty('--px', ((x - r.left) / r.width - 0.5).toFixed(3))
        el.style.setProperty('--py', ((y - r.top) / r.height - 0.5).toFixed(3))
      })
    },
  },
})
</script>

<template>
  <div class="lp" :class="{ 'is-paused': paused, 'lp-anim': animReady }">
    <a class="lp-skip" href="#lp-main">{{ $t('common.skip') }}</a>
    <AppHeader current="home" />
    <div class="lp-scrollbar" aria-hidden="true" />

    <main id="lp-main">
      <!-- ============ HERO ============ -->
      <section class="lp-hero" aria-labelledby="lp-title" @pointermove="onPointer">
        <BgShapes />
        <div class="lp-wrap lp-hero-inner">
          <p class="lp-kicker"><LpIcon name="sparkle" />{{ $t('landing.hero.kicker') }}</p>
          <h1 id="lp-title" class="lp-wordmark">
            <span class="sr-only">{{ appName }}</span>
            <span class="lp-wm-first" aria-hidden="true">
              <span v-for="(ch, i) in wordFirst" :key="'a' + i" class="lp-letter" :style="{ '--i': i }">{{ ch }}</span>
            </span>
            <span class="lp-wm-rest" aria-hidden="true">
              <span v-for="(ch, i) in wordRest" :key="'b' + i" class="lp-letter" :style="{ '--i': i + wordFirst.length }">{{ ch }}</span>
            </span>
          </h1>
          <p class="lp-tagline">
            <span class="lp-tl is-1">{{ $t('landing.hero.tagline1') }}</span>
            <span class="lp-tl is-2">{{ $t('landing.hero.tagline2') }}</span>
            <span class="lp-tl is-3">{{ $t('landing.hero.tagline3') }}</span>
          </p>
          <p class="lp-intro">{{ $t('landing.intro') }}</p>
          <div class="lp-ctas">
            <a class="nb-btn is-primary lp-btn-xl" href="./app/" data-testid="cta-start">
              <LpIcon name="freehand" :size="22" />{{ $t('landing.start') }}<LpIcon class="lp-arrow" name="arrow" :size="22" />
            </a>
            <a class="nb-btn lp-btn-xl" :href="githubUrl" target="_blank" rel="noopener noreferrer" data-testid="cta-github">
              <LpIcon name="github" :size="22" />{{ $t('landing.github') }}<span class="sr-only"> {{ $t('landing.newTab') }}</span>
            </a>
          </div>
          <ul class="lp-stickers">
            <li class="lp-sticker is-teal">{{ $t('landing.stickers.openSource') }}</li>
            <li class="lp-sticker is-coral">{{ $t('landing.stickers.noAccount') }}</li>
            <li class="lp-sticker is-yellow is-mono">{{ $t('landing.stickers.svg') }}</li>
            <li class="lp-sticker is-panel">{{ $t('landing.stickers.free') }}</li>
          </ul>
        </div>
        <svg class="lp-badge" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
          <defs><path id="lp-badge-ring" d="M100 100m-74 0a74 74 0 1 1 148 0a74 74 0 1 1-148 0" /></defs>
          <circle cx="106" cy="106" r="94" fill="var(--shadow)" />
          <circle cx="100" cy="100" r="94" fill="var(--primary)" stroke="var(--ink)" stroke-width="4" />
          <circle cx="100" cy="100" r="56" fill="none" stroke="#0f172a" stroke-width="3" stroke-dasharray="6 6" />
          <g class="lp-badge-spin">
            <text class="lp-badge-text" textLength="458" lengthAdjust="spacing"><textPath href="#lp-badge-ring" textLength="458" lengthAdjust="spacing">{{ $t('landing.hero.badge') }}</textPath></text>
          </g>
          <g transform="translate(64 64) scale(1.125)">
            <rect x="8" y="8" width="56" height="56" fill="#0f172a" />
            <rect x="2" y="2" width="52" height="52" fill="#2ec4b6" stroke="#0f172a" stroke-width="4" />
            <circle cx="28" cy="28" r="18.5" fill="#ffc93c" stroke="#0f172a" stroke-width="3" />
            <ellipse cx="21.5" cy="22.5" rx="3" ry="4.5" fill="#0f172a" />
            <ellipse cx="34.5" cy="22.5" rx="3" ry="4.5" fill="#0f172a" />
            <path d="M 17.5 30.5 A 10.5 9.5 0 0 0 38.5 30.5 Z" fill="#ff6b6b" stroke="#0f172a" stroke-width="2.5" />
          </g>
        </svg>
        <div class="lp-zigzag is-bottom" aria-hidden="true" />
      </section>

      <!-- ============ MARQUEE ============ -->
      <div class="lp-marquee">
        <div class="lp-marquee-row is-a">
          <div class="lp-marquee-track">
            <ul class="lp-marquee-list" :aria-label="$t('landing.marquee.label')">
              <li v-for="w in marquee" :key="w.code"><code>{{ w.code }}</code><span>{{ $t('landing.marquee.' + w.key) }}</span></li>
            </ul>
            <ul class="lp-marquee-list" aria-hidden="true">
              <li v-for="w in marquee" :key="w.code"><code>{{ w.code }}</code><span>{{ $t('landing.marquee.' + w.key) }}</span></li>
            </ul>
          </div>
        </div>
        <div class="lp-marquee-row is-b" aria-hidden="true">
          <div class="lp-marquee-track">
            <ul v-for="n in 2" :key="n" class="lp-marquee-list">
              <li v-for="w in marquee" :key="w.code"><span>{{ $t('landing.marquee.' + w.key) }}</span><code>{{ w.code }}</code></li>
            </ul>
          </div>
        </div>
      </div>

      <!-- ============ LIVE SOURCE ============ -->
      <section id="live" class="lp-section lp-live" aria-labelledby="live-title">
        <div class="lp-wrap">
          <header class="lp-head lp-reveal">
            <p class="lp-num">01 · {{ $t('landing.live.kicker') }}</p>
            <h2 id="live-title">{{ $t('landing.live.title') }}</h2>
            <p class="lp-lead">{{ $t('landing.live.text') }}</p>
          </header>
          <div class="lp-reveal">
            <LiveDemo :paused="paused" :reduced="reduced" @toggle="toggleMotion" />
          </div>
          <ul class="lp-points">
            <li v-for="n in 3" :key="n" class="lp-point lp-reveal" :style="{ '--stagger': n }">
              <span class="lp-point-n">{{ n }}</span>{{ $t('landing.live.point' + n) }}
            </li>
          </ul>
        </div>
      </section>

      <!-- ============ COMBINE ============ -->
      <section id="combine" class="lp-section lp-combine" aria-labelledby="combine-title">
        <div class="lp-wrap">
          <header class="lp-head lp-reveal">
            <p class="lp-num">02 · {{ $t('landing.combine.kicker') }}</p>
            <h2 id="combine-title">{{ $t('landing.combine.title') }}</h2>
            <p class="lp-lead">{{ $t('landing.combine.text') }}</p>
          </header>
          <ul class="lp-grid-4">
            <li v-for="(o, i) in ops" :key="o.op" class="lp-card lp-tilt lp-reveal" :style="{ '--stagger': i }" data-testid="bool-card">
              <BoolCard :op="o.op" :color="o.color" :label="$t('landing.combine.' + o.op + '.alt')" />
              <h3><LpIcon :name="o.op" :size="20" />{{ $t('landing.combine.' + o.op + '.name') }}</h3>
              <p>{{ $t('landing.combine.' + o.op + '.text') }}</p>
            </li>
          </ul>
        </div>
      </section>

      <!-- ============ FILES ============ -->
      <section id="files" class="lp-section lp-files" aria-labelledby="files-title">
        <div class="lp-wrap lp-files-grid">
          <div>
            <header class="lp-head lp-reveal">
              <p class="lp-num">03 · {{ $t('landing.files.kicker') }}</p>
              <h2 id="files-title">{{ $t('landing.files.title') }}</h2>
              <p class="lp-lead">{{ $t('landing.files.text') }}</p>
            </header>
            <ol class="lp-steps">
              <li v-for="(s, i) in fileSteps" :key="s.key" class="lp-step lp-tilt lp-reveal" :style="{ '--stagger': i }">
                <span class="lp-step-icon"><LpIcon :name="s.icon" :size="24" /></span>
                <span><strong>{{ $t('landing.files.' + s.key + '.title') }}</strong>{{ $t('landing.files.' + s.key + '.text') }}</span>
              </li>
            </ol>
          </div>
          <div class="lp-file lp-reveal" aria-hidden="true">
            <svg viewBox="0 0 220 270" class="lp-file-svg" focusable="false">
              <path d="M18 18h132l52 52v192H18z" fill="var(--shadow)" />
              <path d="M8 8h132l52 52v192H8z" fill="var(--panel)" stroke="var(--ink)" stroke-width="4" stroke-linejoin="miter" />
              <path d="M140 8v52h52" fill="var(--primary)" stroke="var(--ink)" stroke-width="4" />
              <g transform="translate(36 52)">
                <circle cx="62" cy="62" r="54" fill="#ffc93c" stroke="#0f172a" stroke-width="4" />
                <ellipse cx="44" cy="48" rx="6" ry="10" fill="#0f172a" />
                <ellipse cx="80" cy="48" rx="6" ry="10" fill="#0f172a" />
                <path d="M32 72 A 30 24 0 0 0 92 72 Z" fill="#ff6b6b" stroke="#0f172a" stroke-width="3" />
              </g>
              <rect x="22" y="196" width="160" height="44" fill="#0f172a" />
              <text x="34" y="225" class="lp-file-code"><tspan fill="#94a3b8">&lt;</tspan><tspan fill="#ff8a8a">svg</tspan><tspan fill="#94a3b8">&gt;</tspan><tspan fill="#ffc93c"> …</tspan><tspan fill="#94a3b8">&lt;/</tspan><tspan fill="#ff8a8a">svg</tspan><tspan fill="#94a3b8">&gt;</tspan></text>
            </svg>
            <span class="lp-file-name is-mono">{{ $t('landing.files.fileName') }}</span>
          </div>
        </div>
      </section>

      <!-- ============ PRIVACY ============ -->
      <section id="privacy" class="lp-section lp-privacy" aria-labelledby="privacy-title">
        <div class="lp-stripes" aria-hidden="true" />
        <div class="lp-wrap">
          <header class="lp-head lp-reveal">
            <p class="lp-num">04 · {{ $t('landing.privacy.kicker') }}</p>
            <h2 id="privacy-title">{{ $t('landing.privacy.title') }}</h2>
            <p class="lp-lead">{{ $t('landing.privacy.text') }}</p>
          </header>
          <ul class="lp-grid-5">
            <li v-for="(p, i) in privacyItems" :key="p.key" class="lp-pcard lp-tilt lp-reveal" :class="p.tone" :style="{ '--stagger': i }">
              <span class="lp-pcard-icon"><LpIcon :name="p.icon" :size="28" /></span>
              <h3>{{ $t('landing.privacy.' + p.key + '.title') }}</h3>
              <p>{{ $t('landing.privacy.' + p.key + '.text') }}</p>
            </li>
          </ul>
        </div>
      </section>

      <!-- ============ SCHOOL ============ -->
      <section id="school" class="lp-section lp-school" aria-labelledby="school-title">
        <div class="lp-wrap">
          <header class="lp-head lp-reveal">
            <p class="lp-num">05 · {{ $t('landing.school.kicker') }}</p>
            <h2 id="school-title"><LpIcon name="school" :size="48" class="lp-h2-icon" />{{ $t('landing.school.title') }}</h2>
            <p class="lp-lead">{{ $t('landing.school.text') }}</p>
          </header>
          <ul class="lp-grid-4">
            <li v-for="(s, i) in schoolItems" :key="s.key" class="lp-card lp-tilt lp-reveal" :style="{ '--stagger': i }">
              <span class="lp-card-icon"><LpIcon :name="s.icon" :size="28" /></span>
              <h3>{{ $t('landing.school.' + s.key + '.title') }}</h3>
              <p>{{ $t('landing.school.' + s.key + '.text') }}</p>
            </li>
          </ul>
        </div>
      </section>

      <!-- ============ FINAL CTA ============ -->
      <section class="lp-cta" aria-labelledby="cta-title">
        <div class="lp-zigzag is-top" aria-hidden="true" />
        <div class="lp-wrap lp-cta-inner lp-reveal">
          <h2 id="cta-title">{{ $t('landing.cta.title') }}</h2>
          <p class="lp-lead">{{ $t('landing.cta.text') }}</p>
          <div class="lp-ctas">
            <a class="nb-btn lp-btn-xl lp-btn-ink" href="./app/" data-testid="cta-start-2">
              <LpIcon name="freehand" :size="22" />{{ $t('landing.start') }}<LpIcon class="lp-arrow" name="arrow" :size="22" />
            </a>
            <a class="nb-btn lp-btn-xl" :href="githubUrl" target="_blank" rel="noopener noreferrer" data-testid="cta-github-2">
              <LpIcon name="github" :size="22" />{{ $t('landing.github') }}<span class="sr-only"> {{ $t('landing.newTab') }}</span>
            </a>
          </div>
        </div>
      </section>
    </main>

    <footer class="lp-footer">
      <div class="lp-wrap lp-footer-inner">
        <div>
          <p class="lp-footer-brand">{{ appName }}</p>
          <p>{{ $t('landing.footer.about') }}</p>
          <p class="lp-footer-small">{{ $t('landing.footer.license') }} · {{ $t('landing.footer.made') }}</p>
        </div>
        <nav class="lp-footer-links" :aria-label="appName">
          <a class="nb-btn" href="./help/"><LpIcon name="help" />{{ $t('landing.footer.help') }}</a>
          <a class="nb-btn" href="./credits/" data-testid="footer-credits"><LpIcon name="credits" />{{ $t('landing.footer.credits') }}</a>
          <a class="nb-btn" :href="githubUrl" target="_blank" rel="noopener noreferrer" data-testid="footer-github">
            <LpIcon name="github" />{{ $t('landing.footer.github') }}<span class="sr-only"> {{ $t('landing.newTab') }}</span>
          </a>
        </nav>
      </div>
    </footer>
  </div>
</template>
