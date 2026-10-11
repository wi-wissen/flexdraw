export const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
/** "Strg" / "Ctrl" are decided by the caller; this is the symbolic modifier for the platform. */
export const modName = (lang: string): string => (isMac ? 'Cmd' : lang === 'de' ? 'Strg' : 'Ctrl')
export const withKey = (text: string, keys: string): string => `${text} (${keys})`
