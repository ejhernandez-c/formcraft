import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import type { CurrentUser } from '@/services/auth'
import { getCurrentUser } from '@/services/auth'

const TOKEN_STORAGE_KEY = 'formcraft.auth.token'

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated'

interface AuthContextValue {
  status: AuthStatus
  user: CurrentUser | null
  token: string | null
  login: (token: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

function storeToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
    }
  } catch {
    // localStorage unavailable (private browsing, etc.) — the session just
    // won't persist across reloads; not fatal.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>(() =>
    readStoredToken() ? 'checking' : 'unauthenticated',
  )

  // Deliberately promise-chained rather than async/await: the lint rule
  // guarding effects (react-hooks/set-state-in-effect) only recognizes
  // setState calls made from a .then()/.catch() callback as the "external
  // async boundary" it expects — the same shape as Phase 1's useHealthCheck
  // (frontend/src/hooks/useHealthCheck.ts). An async function's setState
  // calls after an `await` read as effectively-synchronous to that rule.
  const applyToken = useCallback((nextToken: string) => {
    return getCurrentUser(nextToken).then((profile) => {
      storeToken(nextToken)
      setToken(nextToken)
      setUser(profile)
      setStatus('authenticated')
    })
  }, [])

  const loadStoredSession = useCallback(() => {
    const stored = readStoredToken()
    if (!stored) {
      return
    }
    applyToken(stored).catch(() => {
      storeToken(null)
      setToken(null)
      setUser(null)
      setStatus('unauthenticated')
    })
  }, [applyToken])

  useEffect(() => {
    loadStoredSession()
  }, [loadStoredSession])

  const login = useCallback((nextToken: string) => applyToken(nextToken), [applyToken])

  const logout = useCallback(() => {
    storeToken(null)
    setToken(null)
    setUser(null)
    setStatus('unauthenticated')
  }, [])

  const value = useMemo(
    () => ({ status, user, token, login, logout }),
    [status, user, token, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
