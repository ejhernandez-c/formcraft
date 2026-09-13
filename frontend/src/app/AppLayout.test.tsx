import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AppLayout } from '@/app/AppLayout'
import { AuthProvider } from '@/features/auth/AuthContext'
import * as apiService from '@/services/api'
import * as authService from '@/services/auth'

vi.mock('@/services/auth')
vi.mock('@/services/api')

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.setItem('formcraft.auth.token', 'valid-token')
  vi.mocked(authService.getCurrentUser).mockResolvedValue({
    id: 'u1',
    email: 'ada@example.com',
    name: 'Ada Lovelace',
    created_at: '2026-01-01',
  })
})

describe('AppLayout', () => {
  it('shows the signed-in user and a connectivity indicator', async () => {
    vi.mocked(apiService.getHealth).mockResolvedValue({ status: 'ok' })

    render(
      <AuthProvider>
        <MemoryRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<div>page content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByText('Ada Lovelace')).toBeInTheDocument())
    expect(screen.getByText('page content')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByText('Conectado al servidor correctamente.')).toBeInTheDocument(),
    )
  })
})
