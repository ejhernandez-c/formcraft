import { Outlet } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/AuthContext'
import { useHealthCheck } from '@/hooks/useHealthCheck'
import type { HealthStatus } from '@/hooks/useHealthCheck'
import type { TranslationKey } from '@/i18n'
import { t } from '@/i18n'

const HEALTH_DOT_STYLES: Record<HealthStatus, string> = {
  checking: 'bg-muted-foreground',
  ok: 'bg-green-600',
  error: 'bg-red-600',
}

const HEALTH_LABEL_KEYS: Record<HealthStatus, TranslationKey> = {
  checking: 'health.checking',
  ok: 'health.ok',
  error: 'health.error',
}

export function AppLayout() {
  const { user, logout } = useAuth()
  const { status } = useHealthCheck()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <span className="text-lg font-semibold">{t('app.title')}</span>
        <div className="flex items-center gap-3">
          {user && <span className="text-sm text-muted-foreground">{user.name}</span>}
          <Button variant="outline" size="sm" onClick={logout}>
            {t('auth.logout')}
          </Button>
        </div>
      </header>

      <div className="flex-1">
        <Outlet />
      </div>

      <footer className="flex items-center gap-2 px-6 py-3 text-xs text-muted-foreground">
        <span className={`inline-block size-2 rounded-full ${HEALTH_DOT_STYLES[status]}`} />
        {t(HEALTH_LABEL_KEYS[status])}
      </footer>
    </div>
  )
}
