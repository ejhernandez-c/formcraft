import { apiFetch } from '@/services/api'

// Mirrors backend/app/modules/forms/schemas.py's Literal types.
export type FormType = 'survey' | 'event_registration' | 'registration' | 'application' | 'blank'
export type FormStatus = 'draft' | 'published' | 'closed' | 'archived'
export type IdentificationType = 'anonymous' | 'identified'

export interface FormListItem {
  id: string
  slug: string
  name: string
  form_type: FormType
  status: FormStatus
  updated_at: string
  response_count: number
}

export interface FormListResponse {
  items: FormListItem[]
  page: number
  page_size: number
  total: number
}

export interface FormDetail {
  id: string
  owner_id: string
  slug: string
  name: string
  description: string | null
  form_type: FormType
  status: FormStatus
  identification_type: IdentificationType
  allow_multiple_responses: boolean
  response_limit_enabled: boolean
  max_responses: number | null
  one_response_per_email: boolean
  open_at: string | null
  close_at: string | null
  settings: Record<string, unknown>
  theme: Record<string, unknown>
  published_at: string | null
  created_at: string
  updated_at: string
  response_count: number
}

export interface FormUpdatePayload {
  name: string
  description: string | null
  identification_type: IdentificationType
  allow_multiple_responses: boolean
  response_limit_enabled: boolean
  max_responses: number | null
  one_response_per_email: boolean
  open_at: string | null
  close_at: string | null
  settings: Record<string, unknown>
  theme: Record<string, unknown>
}

export interface ListFormsParams {
  search?: string
  sort?: string
}

export function listForms(token: string, params: ListFormsParams = {}): Promise<FormListResponse> {
  const query = new URLSearchParams()
  if (params.search) query.set('search', params.search)
  if (params.sort) query.set('sort', params.sort)
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return apiFetch<FormListResponse>(`/api/forms${suffix}`, { token })
}

export function createForm(token: string, name: string, formType: FormType): Promise<FormDetail> {
  return apiFetch<FormDetail>('/api/forms', {
    method: 'POST',
    token,
    body: { name, form_type: formType },
  })
}

export function getForm(token: string, id: string): Promise<FormDetail> {
  return apiFetch<FormDetail>(`/api/forms/${id}`, { token })
}

export function updateForm(
  token: string,
  id: string,
  payload: FormUpdatePayload,
): Promise<FormDetail> {
  return apiFetch<FormDetail>(`/api/forms/${id}`, { method: 'PUT', token, body: payload })
}

export function duplicateForm(token: string, id: string): Promise<FormDetail> {
  return apiFetch<FormDetail>(`/api/forms/${id}/duplicate`, { method: 'POST', token })
}

export function publishForm(token: string, id: string): Promise<FormDetail> {
  return apiFetch<FormDetail>(`/api/forms/${id}/publish`, { method: 'POST', token })
}

export function closeForm(token: string, id: string): Promise<FormDetail> {
  return apiFetch<FormDetail>(`/api/forms/${id}/close`, { method: 'POST', token })
}

export function archiveForm(token: string, id: string): Promise<FormDetail> {
  return apiFetch<FormDetail>(`/api/forms/${id}/archive`, { method: 'POST', token })
}
