import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TranslationKey } from '@/i18n'
import { t } from '@/i18n'
import type { FormListItem, FormStatus } from '@/services/forms'

const STATUS_LABEL_KEYS: Record<FormStatus, TranslationKey> = {
  draft: 'dashboard.statusDraft',
  published: 'dashboard.statusPublished',
  closed: 'dashboard.statusClosed',
  archived: 'dashboard.statusArchived',
}

interface FormCardProps {
  form: FormListItem
  onPublish: () => void
  onClose: () => void
  onArchive: () => void
  onDuplicate: () => void
  isMutating: boolean
}

export function FormCard({
  form,
  onPublish,
  onClose,
  onArchive,
  onDuplicate,
  isMutating,
}: FormCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>{form.name}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {form.response_count} {t('dashboard.responseCount')} · {t('dashboard.updatedAt')}{' '}
            {new Date(form.updated_at).toLocaleDateString('es-ES')}
          </p>
        </div>
        <Badge variant="secondary">{t(STATUS_LABEL_KEYS[form.status])}</Badge>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Link
          to={`/forms/${form.id}`}
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
        >
          {t('dashboard.actionEdit')}
        </Link>
        <Button size="sm" variant="outline" disabled={isMutating} onClick={onDuplicate}>
          {t('dashboard.actionDuplicate')}
        </Button>
        {form.status === 'draft' && (
          <Button size="sm" disabled={isMutating} onClick={onPublish}>
            {t('dashboard.actionPublish')}
          </Button>
        )}
        {form.status === 'published' && (
          <Button size="sm" variant="outline" disabled={isMutating} onClick={onClose}>
            {t('dashboard.actionClose')}
          </Button>
        )}
        {form.status !== 'archived' && (
          <Button size="sm" variant="outline" disabled={isMutating} onClick={onArchive}>
            {t('dashboard.actionArchive')}
          </Button>
        )}
        <Button size="sm" variant="ghost" disabled title={t('dashboard.comingSoon')}>
          {t('dashboard.actionPreview')}
        </Button>
        <Button size="sm" variant="ghost" disabled title={t('dashboard.comingSoon')}>
          {t('dashboard.actionResults')}
        </Button>
        <Button size="sm" variant="ghost" disabled title={t('dashboard.comingSoon')}>
          {t('dashboard.actionShare')}
        </Button>
      </CardContent>
    </Card>
  )
}
