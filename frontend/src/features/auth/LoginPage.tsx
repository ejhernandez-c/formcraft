import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/features/auth/AuthContext'
import { t } from '@/i18n'
import { devLogin } from '@/services/auth'

// Cognito isn't provisioned yet — see docs/SECURITY.md §2 and
// backend/app/core/security.py. Until it is, the local dev-login form below
// is the only functional sign-in path; the Google button stays visibly
// disabled rather than pretending to work.
const AUTH_MODE: string = import.meta.env.VITE_AUTH_MODE ?? 'local'

export function LoginPage() {
  const { status, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (status === 'authenticated') {
    return <Navigate to="/" replace />
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    devLogin(email, name)
      .then(({ access_token }) => login(access_token))
      .then(() => navigate('/', { replace: true }))
      .catch(() => setError(t('auth.loginError')))
      .finally(() => setSubmitting(false))
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">{t('auth.loginTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('auth.loginSubtitle')}</p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled
          title={t('auth.googleUnavailable')}
        >
          {t('auth.googleButton')}
        </Button>

        {AUTH_MODE === 'local' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-muted-foreground">{t('auth.localModeNotice')}</p>
            <div className="space-y-1.5">
              <Label htmlFor="login-email">{t('auth.emailLabel')}</Label>
              <Input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="login-name">{t('auth.nameLabel')}</Label>
              <Input
                id="login-name"
                type="text"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {t('auth.continueButton')}
            </Button>
          </form>
        )}
      </div>
    </main>
  )
}
