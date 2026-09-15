import { describe, expect, it } from 'vitest'

import { isBannerEnabled } from '@/lib/themeFlags'

describe('isBannerEnabled', () => {
  it('is true when the key is absent (pre-existing/new forms)', () => {
    expect(isBannerEnabled({})).toBe(true)
  })

  it('is true when explicitly set to true', () => {
    expect(isBannerEnabled({ banner_enabled: true })).toBe(true)
  })

  it('is false only when explicitly set to false', () => {
    expect(isBannerEnabled({ banner_enabled: false })).toBe(false)
  })
})
