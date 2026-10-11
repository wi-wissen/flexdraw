// Minimal window/document stand-in so Paper.js (browser build) can load and run
// geometry code (booleans, bounds, simplify) without a browser or canvas package.
// Only installed when no real DOM exists, so jsdom component tests are unaffected.
if (typeof document === 'undefined') {
  const g = globalThis as any
  const ctx = new Proxy({} as any, {
    get: (t, k) => (k in t ? t[k] : () => {}),
    set: (t, k, v) => ((t[k] = v), true),
  })
  g.self = g
  g.window = g
  g.addEventListener = () => {}
  g.removeEventListener = () => {}
  g.HTMLCanvasElement = class {}
  const el: any = Object.assign(new g.HTMLCanvasElement(), {
    getContext: () => ctx,
    style: {},
    width: 1,
    height: 1,
    addEventListener() {},
    getAttribute: () => null,
    setAttribute() {},
    hasAttribute: () => false,
    parentNode: null,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0 }),
  })
  g.document = {
    createElement: () => el,
    addEventListener() {},
    documentElement: { style: {} },
    body: {},
    getElementById: () => null,
  }
  el.ownerDocument = g.document
  Object.defineProperty(g, 'navigator', { value: { userAgent: 'node' }, configurable: true })
}
