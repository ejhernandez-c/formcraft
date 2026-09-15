/** Absence of the `banner_enabled` key — every form created before this
 * feature, and every new form by default — means "shown". Only an
 * explicit `false` hides the header banner. */
export function isBannerEnabled(theme: Record<string, unknown>): boolean {
  return theme.banner_enabled !== false
}
