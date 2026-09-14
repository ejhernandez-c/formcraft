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
