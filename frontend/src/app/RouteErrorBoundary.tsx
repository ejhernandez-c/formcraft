import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'

import { buttonVariants } from '@/components/ui/button'
import { t } from '@/i18n'

/** React Router's errorElement — without this, an uncaught render error
 * anywhere in a route's tree falls back to React Router's own default
 * error page, which shows raw developer-facing text ("You can provide a
 * way better UX...") directly to the user. This replaces that with
 * something a creator can actually act on. */
export function RouteErrorBoundary() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : t('common.unexpectedError')

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold">{t('common.somethingWentWrong')}</h1>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      <Link to="/" className={buttonVariants({ variant: 'default' })}>
        {t('forms.backToDashboard')}
      </Link>
    </main>
  )
}
