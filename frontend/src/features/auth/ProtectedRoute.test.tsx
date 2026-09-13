import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '@/features/auth/AuthContext'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import * as authService from '@/services/auth'

vi.mock('@/services/auth')

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

function renderAt(path: string) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<div>login page</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<div>dashboard content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('ProtectedRoute', () => {
  it('redirects to /login when unauthenticated', async () => {
    renderAt('/')

    await waitFor(() => expect(screen.getByText('login page')).toBeInTheDocument())
  })

  it('renders the protected content once authenticated', async () => {
    localStorage.setItem('formcraft.auth.token', 'valid-token')
    vi.mocked(authService.getCurrentUser).mockResolvedValue({
      id: 'u1',
      email: 'ada@example.com',
      name: 'Ada',
      created_at: '2026-01-01',
    })

    renderAt('/')

    await waitFor(() => expect(screen.getByText('dashboard content')).toBeInTheDocument())
  })
})
