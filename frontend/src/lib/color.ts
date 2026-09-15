/** Darkens a `#rrggbb` hex color by `amount` (0–1, fraction of each channel
 * removed). Falls back to the input unchanged if it isn't a valid 6-digit
 * hex — callers always have a safe hard-coded default to fall back to. */
export function darken(hex: string, amount: number): string {
  const match = /^#?([0-9a-fA-F]{6})$/.exec(hex)
  if (!match) return hex

  const value = parseInt(match[1], 16)
  const r = Math.max(0, Math.round(((value >> 16) & 0xff) * (1 - amount)))
  const g = Math.max(0, Math.round(((value >> 8) & 0xff) * (1 - amount)))
  const b = Math.max(0, Math.round((value & 0xff) * (1 - amount)))

  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

const PRESET_PRIMARY_COLORS = [
  '#7c3aed',
  '#2563eb',
  '#059669',
  '#d97706',
  '#dc2626',
  '#db2777',
  '#0891b2',
  '#4f46e5',
]

/** Picks a random preset different from `current` where possible — falls
 * back to the full pool if `current` isn't one of the presets (e.g. a
 * custom color chosen via ThemeDialog's color picker). */
export function shufflePrimaryColor(current: string): string {
  const candidates = PRESET_PRIMARY_COLORS.filter(
    (color) => color.toLowerCase() !== current.toLowerCase(),
  )
  const pool = candidates.length > 0 ? candidates : PRESET_PRIMARY_COLORS
  return pool[Math.floor(Math.random() * pool.length)]
}
