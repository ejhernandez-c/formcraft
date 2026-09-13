import type { TranslationKey } from '@/i18n'

// Mirrors backend/app/modules/form_builder/models.py's
// CONTENT_CONTROL_TYPES / QUESTION_CONTROL_TYPES — keep in sync.
export type ContentControlType = 'heading' | 'paragraph' | 'instruction' | 'image' | 'divider'
export type QuestionControlType =
  | 'short_text'
  | 'long_text'
  | 'number'
  | 'email'
  | 'date'
  | 'dropdown'
  | 'radio'
  | 'checkbox'
  | 'yes_no'
  | 'rating'
export type ControlType = ContentControlType | QuestionControlType
export type ElementKind = 'content' | 'question'

export interface ControlDefinition {
  controlType: ControlType
  elementKind: ElementKind
  labelKey: TranslationKey
  supportsOptions: boolean
}

export const CONTENT_CONTROLS: ControlDefinition[] = [
  {
    controlType: 'heading',
    elementKind: 'content',
    labelKey: 'builder.control.heading',
    supportsOptions: false,
  },
  {
    controlType: 'paragraph',
    elementKind: 'content',
    labelKey: 'builder.control.paragraph',
    supportsOptions: false,
  },
  {
    controlType: 'instruction',
    elementKind: 'content',
    labelKey: 'builder.control.instruction',
    supportsOptions: false,
  },
  {
    controlType: 'image',
    elementKind: 'content',
    labelKey: 'builder.control.image',
    supportsOptions: false,
  },
  {
    controlType: 'divider',
    elementKind: 'content',
    labelKey: 'builder.control.divider',
    supportsOptions: false,
  },
]

export const QUESTION_CONTROLS: ControlDefinition[] = [
  {
    controlType: 'short_text',
    elementKind: 'question',
    labelKey: 'builder.control.shortText',
    supportsOptions: false,
  },
  {
    controlType: 'long_text',
    elementKind: 'question',
    labelKey: 'builder.control.longText',
    supportsOptions: false,
  },
  {
    controlType: 'number',
    elementKind: 'question',
    labelKey: 'builder.control.number',
    supportsOptions: false,
  },
  {
    controlType: 'email',
    elementKind: 'question',
    labelKey: 'builder.control.email',
    supportsOptions: false,
  },
  {
    controlType: 'date',
    elementKind: 'question',
    labelKey: 'builder.control.date',
    supportsOptions: false,
  },
  {
    controlType: 'dropdown',
    elementKind: 'question',
    labelKey: 'builder.control.dropdown',
    supportsOptions: true,
  },
  {
    controlType: 'radio',
    elementKind: 'question',
    labelKey: 'builder.control.radio',
    supportsOptions: true,
  },
  {
    controlType: 'checkbox',
    elementKind: 'question',
    labelKey: 'builder.control.checkbox',
    supportsOptions: true,
  },
  {
    controlType: 'yes_no',
    elementKind: 'question',
    labelKey: 'builder.control.yesNo',
    supportsOptions: false,
  },
  {
    controlType: 'rating',
    elementKind: 'question',
    labelKey: 'builder.control.rating',
    supportsOptions: false,
  },
]

export const ALL_CONTROLS: ControlDefinition[] = [...CONTENT_CONTROLS, ...QUESTION_CONTROLS]

export function getControlDefinition(controlType: string): ControlDefinition | undefined {
  return ALL_CONTROLS.find((control) => control.controlType === controlType)
}

export function defaultSettingsFor(controlType: ControlType): Record<string, unknown> {
  switch (controlType) {
    case 'rating':
      return { min: 1, max: 5, allow_half: false }
    case 'image':
      return { url: '' }
    case 'heading':
      return { level: 2 }
    default:
      return {}
  }
}
