import { describe, expect, it } from 'vitest'

import { darken, shufflePrimaryColor } from '@/lib/color'

describe('darken', () => {
  it('darkens each channel by the given fraction', () => {
    expect(darken('#7c3aed', 0)).toBe('#7c3aed')
    expect(darken('#ffffff', 0.5)).toBe('#808080')
  })

  it('returns the input unchanged for an invalid hex', () => {
    expect(darken('not-a-color', 0.5)).toBe('not-a-color')
  })
})

describe('shufflePrimaryColor', () => {
  it('never returns the current color when other presets exist', () => {
    for (let i = 0; i < 20; i++) {
      expect(shufflePrimaryColor('#7c3aed')).not.toBe('#7c3aed')
    }
  })

  it('is case-insensitive when comparing against the current color', () => {
    for (let i = 0; i < 20; i++) {
      expect(shufflePrimaryColor('#7C3AED').toLowerCase()).not.toBe('#7c3aed')
    }
  })

  it('still returns a color for an unrecognized current value', () => {
    expect(typeof shufflePrimaryColor('#123456')).toBe('string')
  })
})
