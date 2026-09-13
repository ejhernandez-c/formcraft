import type { ControlType, ElementKind } from '@/features/builder/controlTypes'
import { apiFetch } from '@/services/api'

export interface QuestionOption {
  id: string
  label: string
  value: string | null
  order_index: number
}

export interface QuestionOptionInput {
  label: string
  value?: string | null
}

export interface FormSection {
  id: string
  form_id: string
  title: string | null
  description: string | null
  order_index: number
}

export interface FormElement {
  id: string
  form_id: string
  section_id: string
  element_kind: ElementKind
  control_type: ControlType
  order_index: number
  label: string | null
  help_text: string | null
  settings: Record<string, unknown>
  validation: Record<string, unknown>
  options: QuestionOption[]
}

export interface FormSectionInput {
  title?: string | null
  description?: string | null
}

export interface FormElementInput {
  element_kind: ElementKind
  control_type: ControlType
  label?: string | null
  help_text?: string | null
  settings?: Record<string, unknown>
  validation?: Record<string, unknown>
  options?: QuestionOptionInput[]
}

export function listSections(token: string, formId: string): Promise<FormSection[]> {
  return apiFetch<FormSection[]>(`/api/forms/${formId}/sections`, { token })
}

export function createSection(
  token: string,
  formId: string,
  data: FormSectionInput,
): Promise<FormSection> {
  return apiFetch<FormSection>(`/api/forms/${formId}/sections`, {
    method: 'POST',
    token,
    body: data,
  })
}

export function updateSection(
  token: string,
  formId: string,
  sectionId: string,
  data: FormSectionInput,
): Promise<FormSection> {
  return apiFetch<FormSection>(`/api/forms/${formId}/sections/${sectionId}`, {
    method: 'PUT',
    token,
    body: data,
  })
}

export function deleteSection(token: string, formId: string, sectionId: string): Promise<void> {
  return apiFetch<void>(`/api/forms/${formId}/sections/${sectionId}`, { method: 'DELETE', token })
}

export function reorderSections(
  token: string,
  formId: string,
  items: { id: string; order_index: number }[],
): Promise<FormSection[]> {
  return apiFetch<FormSection[]>(`/api/forms/${formId}/sections/reorder`, {
    method: 'POST',
    token,
    body: items,
  })
}

export function listElements(token: string, formId: string): Promise<FormElement[]> {
  return apiFetch<FormElement[]>(`/api/forms/${formId}/elements`, { token })
}

export function createElement(
  token: string,
  formId: string,
  sectionId: string,
  data: FormElementInput,
): Promise<FormElement> {
  return apiFetch<FormElement>(`/api/forms/${formId}/sections/${sectionId}/elements`, {
    method: 'POST',
    token,
    body: data,
  })
}

export function updateElement(
  token: string,
  formId: string,
  elementId: string,
  data: FormElementInput,
): Promise<FormElement> {
  return apiFetch<FormElement>(`/api/forms/${formId}/elements/${elementId}`, {
    method: 'PUT',
    token,
    body: data,
  })
}

export function deleteElement(token: string, formId: string, elementId: string): Promise<void> {
  return apiFetch<void>(`/api/forms/${formId}/elements/${elementId}`, { method: 'DELETE', token })
}

export function reorderElements(
  token: string,
  formId: string,
  items: { id: string; section_id: string; order_index: number }[],
): Promise<FormElement[]> {
  return apiFetch<FormElement[]>(`/api/forms/${formId}/elements/reorder`, {
    method: 'POST',
    token,
    body: items,
  })
}
