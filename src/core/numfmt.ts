/** Rounds to at most two decimals and drops trailing zeros and "-0". */
export function num(n: number): string {
  const r = Math.round(n * 100) / 100
  return Object.is(r, -0) || r === 0 ? '0' : String(r)
}

export function round2(n: number): number {
  const r = Math.round(n * 100) / 100
  return r === 0 ? 0 : r
}

/** Rounds every number inside SVG path data to two decimals, keeping the rest. */
export function roundPathData(d: string): string {
  return d.replace(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi, (m) => num(parseFloat(m)))
}
