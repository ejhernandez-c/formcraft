import { apiFetch } from '@/services/api'

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface CurrentUser {
  id: string
  email: string
  name: string
  created_at: string
}

export function devLogin(email: string, name: string): Promise<TokenResponse> {
  return apiFetch<TokenResponse>('/api/auth/dev-login', {
    method: 'POST',
    body: { email, name },
  })
}

export function getCurrentUser(token: string): Promise<CurrentUser> {
  return apiFetch<CurrentUser>('/api/users/me', { token })
}
