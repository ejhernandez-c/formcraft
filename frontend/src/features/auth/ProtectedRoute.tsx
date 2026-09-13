import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '@/features/auth/AuthContext'
import { t } from '@/i18n'

export function ProtectedRoute() {
  const { status } = useAuth()

  if (status === 'checking') {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">{t('auth.checkingSession')}</p>
      </main>
    )
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
