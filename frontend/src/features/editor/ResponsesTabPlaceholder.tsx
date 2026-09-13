import { t } from '@/i18n'

export function ResponsesTabPlaceholder() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center p-6">
      <p className="text-sm text-muted-foreground">{t('editor.responsesComingSoon')}</p>
    </div>
  )
}
