import type { ControlType } from '@/features/builder/controlTypes'
import type { FormElement, FormElementInput, QuestionOptionInput } from '@/services/formBuilder'

// A flattened, control-type-agnostic shape for the properties panel's form
// state — simpler to drive with React Hook Form than a nested settings bag
// that changes shape per control_type. Mapped to/from the API's
// {settings, validation, options} shape at the edges (toFormValues / toApiPayload).
export interface ElementFormValues {
  label: string
  help_text: string
  required: boolean
  options: { label: string; value: string }[]
  numberMin: string
  numberMax: string
  numberDecimals: string
  ratingMin: string
  ratingMax: string
  ratingAllowHalf: boolean
  imageUrl: string
  headingLevel: string
}

export function toFormValues(element: FormElement): ElementFormValues {
  const settings = element.settings ?? {}
  return {
    label: element.label ?? '',
    help_text: element.help_text ?? '',
    required: Boolean(element.validation?.required),
    options: element.options.map((option) => ({ label: option.label, value: option.value ?? '' })),
    numberMin: settings.min !== undefined && settings.min !== null ? String(settings.min) : '',
    numberMax: settings.max !== undefined && settings.max !== null ? String(settings.max) : '',
    numberDecimals:
      settings.decimals !== undefined && settings.decimals !== null
        ? String(settings.decimals)
        : '',
    ratingMin: settings.min !== undefined && settings.min !== null ? String(settings.min) : '1',
    ratingMax: settings.max !== undefined && settings.max !== null ? String(settings.max) : '5',
    ratingAllowHalf: Boolean(settings.allow_half),
    imageUrl: typeof settings.url === 'string' ? settings.url : '',
    headingLevel:
      settings.level !== undefined && settings.level !== null ? String(settings.level) : '2',
  }
}

function toNumberOrUndefined(value: string): number | undefined {
  if (value.trim() === '') return undefined
  const parsed = Number(value)
  return Number.isNaN(parsed) ? undefined : parsed
}

export function toApiPayload(
  values: ElementFormValues,
  elementKind: 'content' | 'question',
  controlType: ControlType,
): FormElementInput {
  let settings: Record<string, unknown> = {}
  let options: QuestionOptionInput[] = []

  switch (controlType) {
    case 'number': {
      const min = toNumberOrUndefined(values.numberMin)
      const max = toNumberOrUndefined(values.numberMax)
      const decimals = toNumberOrUndefined(values.numberDecimals)
      settings = {
        ...(min !== undefined && { min }),
        ...(max !== undefined && { max }),
        ...(decimals !== undefined && { decimals }),
      }
      break
    }
    case 'rating':
      settings = {
        min: toNumberOrUndefined(values.ratingMin) ?? 1,
        max: toNumberOrUndefined(values.ratingMax) ?? 5,
        allow_half: values.ratingAllowHalf,
      }
      break
    case 'image':
      settings = { url: values.imageUrl }
      break
    case 'heading':
      settings = { level: toNumberOrUndefined(values.headingLevel) ?? 2 }
      break
    case 'dropdown':
    case 'radio':
    case 'checkbox':
      options = values.options
        .filter((option) => option.label.trim() !== '')
        .map((option) => ({ label: option.label, value: option.value || null }))
      break
    default:
      break
  }

  return {
    element_kind: elementKind,
    control_type: controlType,
    label: values.label || null,
    help_text: values.help_text || null,
    settings,
    validation: elementKind === 'question' ? { required: values.required } : {},
    options,
  }
}
