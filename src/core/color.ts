const HEX = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

/** Normalises user input to "#rrggbb" lowercase, or null if invalid. */
export function normalizeHex(input: string): string | null {
  const m = HEX.exec(input.trim())
  if (!m) return null
  let h = m[1]!.toLowerCase()
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  return '#' + h
}

export function isHex6(v: string): boolean {
  return /^#[0-9a-f]{6}$/.test(v)
}
