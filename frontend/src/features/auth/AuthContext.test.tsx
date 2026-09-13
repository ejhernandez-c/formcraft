import { act, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider, useAuth } from '@/features/auth/AuthContext'
import * as authService from '@/services/auth'

vi.mock('@/services/auth')

const mockedGetCurrentUser = vi.mocked(authService.getCurrentUser)

const FAKE_USER = { id: 'u1', email: 'ada@example.com', name: 'Ada', created_at: '2026-01-01' }

function Probe() {
  const { status, user, login, logout } = useAuth()
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="user-name">{user?.name ?? ''}</span>
      <button onClick={() => login('token-123')}>login</button>
      <button onClick={logout}>logout</button>
    </div>
  )
}

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

describe('AuthProvider', () => {
  it('starts unauthenticated when no token is stored', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'))
  })

  it('login fetches the profile and becomes authenticated', async () => {
    mockedGetCurrentUser.mockResolvedValue(FAKE_USER)
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'))

    await act(async () => {
      screen.getByText('login').click()
    })

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))
    expect(screen.getByTestId('user-name')).toHaveTextContent('Ada')
    expect(localStorage.getItem('formcraft.auth.token')).toBe('token-123')
  })

  it('restores a session from a stored token on mount', async () => {
    localStorage.setItem('formcraft.auth.token', 'stored-token')
    mockedGetCurrentUser.mockResolvedValue(FAKE_USER)

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))
    expect(mockedGetCurrentUser).toHaveBeenCalledWith('stored-token')
  })

  it('clears an invalid stored token instead of getting stuck authenticated', async () => {
    localStorage.setItem('formcraft.auth.token', 'stale-token')
    mockedGetCurrentUser.mockRejectedValue(new Error('unauthorized'))

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'))
    expect(localStorage.getItem('formcraft.auth.token')).toBeNull()
  })

  it('logout clears the session', async () => {
    mockedGetCurrentUser.mockResolvedValue(FAKE_USER)
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await act(async () => {
      screen.getByText('login').click()
    })
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))

    act(() => {
      screen.getByText('logout').click()
    })

    expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
    expect(localStorage.getItem('formcraft.auth.token')).toBeNull()
  })
})
