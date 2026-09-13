import auth from './es/auth.json'
import builder from './es/builder.json'
import common from './es/common.json'
import dashboard from './es/dashboard.json'
import forms from './es/forms.json'

// MVP is Spanish-only (see docs/UX.md §11); this dependency-free t(key)
// is intentionally minimal for Phase 1 — every component already routes
// strings through it instead of hardcoding, so upgrading to a full i18n
// library (react-i18next) later, once pluralization/interpolation/multiple
// locales are actually needed, is a drop-in swap behind the same API.
// One file per feature area (CLAUDE.md §21) merged into a single flat
// dictionary — keys are already namespaced by prefix (e.g. "auth.*").
const es = { ...common, ...auth, ...dashboard, ...forms, ...builder } as const
const dictionaries = { es } as const

type Locale = keyof typeof dictionaries
export type TranslationKey = keyof typeof es

const currentLocale: Locale = 'es'

export function t(key: TranslationKey): string {
  return dictionaries[currentLocale][key]
}
