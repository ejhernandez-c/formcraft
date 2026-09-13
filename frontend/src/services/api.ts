const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export interface HealthResponse {
  status: string
}

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/health`)
  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`)
  }
  return response.json() as Promise<HealthResponse>
}

// Matches the backend's error envelope — see docs/API.md §1 and
// backend/app/core/errors.py. Every non-2xx response has this shape.
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fields?: Record<string, string>

  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message)
    this.status = status
    this.code = code
    this.fields = fields
  }
}

interface ApiFetchOptions {
  method?: string
  token?: string | null
  body?: unknown
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  if (!response.ok) {
    let code = 'UNKNOWN_ERROR'
    let message = `Request failed with status ${response.status}`
    let fields: Record<string, string> | undefined

    try {
      const data: unknown = await response.json()
      if (data && typeof data === 'object' && 'error' in data) {
        const envelope = (
          data as { error: { code?: string; message?: string; fields?: Record<string, string> } }
        ).error
        code = envelope.code ?? code
        message = envelope.message ?? message
        fields = envelope.fields ?? undefined
      }
    } catch {
      // Response body wasn't JSON — keep the generic message.
    }

    throw new ApiError(response.status, code, message, fields)
  }

  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}
