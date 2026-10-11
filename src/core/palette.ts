// Fixed hex table with the Tailwind v3 colours. Never oklch, never CSS variables.
export const SHADES = [200, 400, 500, 600, 800] as const
export type Shade = (typeof SHADES)[number]

export interface PaletteFamily {
  family: string
  /** i18n key suffix under colors.* */
  hex: Record<Shade, string>
}

export const PALETTE: PaletteFamily[] = [
  { family: 'red', hex: { 200: '#fecaca', 400: '#f87171', 500: '#ef4444', 600: '#dc2626', 800: '#991b1b' } },
  { family: 'orange', hex: { 200: '#fed7aa', 400: '#fb923c', 500: '#f97316', 600: '#ea580c', 800: '#9a3412' } },
  { family: 'amber', hex: { 200: '#fde68a', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 800: '#92400e' } },
  { family: 'yellow', hex: { 200: '#fef08a', 400: '#facc15', 500: '#eab308', 600: '#ca8a04', 800: '#854d0e' } },
  { family: 'lime', hex: { 200: '#d9f99d', 400: '#a3e635', 500: '#84cc16', 600: '#65a30d', 800: '#3f6212' } },
  { family: 'green', hex: { 200: '#bbf7d0', 400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 800: '#166534' } },
  { family: 'teal', hex: { 200: '#99f6e4', 400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 800: '#115e59' } },
  { family: 'cyan', hex: { 200: '#a5f3fc', 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2', 800: '#155e75' } },
  { family: 'sky', hex: { 200: '#bae6fd', 400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', 800: '#075985' } },
  { family: 'blue', hex: { 200: '#bfdbfe', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 800: '#1e40af' } },
  { family: 'indigo', hex: { 200: '#c7d2fe', 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 800: '#3730a3' } },
  { family: 'violet', hex: { 200: '#ddd6fe', 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 800: '#5b21b6' } },
  { family: 'purple', hex: { 200: '#e9d5ff', 400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 800: '#6b21a8' } },
  { family: 'pink', hex: { 200: '#fbcfe8', 400: '#f472b6', 500: '#ec4899', 600: '#db2777', 800: '#9d174d' } },
  { family: 'rose', hex: { 200: '#fecdd3', 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 800: '#9f1239' } },
  { family: 'slate', hex: { 200: '#e2e8f0', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 800: '#1e293b' } },
  { family: 'stone', hex: { 200: '#e7e5e4', 400: '#a8a29e', 500: '#78716c', 600: '#57534e', 800: '#292524' } },
]

export const BLACK = '#000000'
export const WHITE = '#ffffff'

/** Every hex value offered by the palette. */
export function allPaletteHex(): string[] {
  return [BLACK, WHITE, ...PALETTE.flatMap((f) => Object.values(f.hex))]
}
