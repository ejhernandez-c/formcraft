import { MoreVertical } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FormThumbnail } from '@/features/dashboard/FormThumbnail'
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
  const navigate = useNavigate()

  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md">
      <Link to={`/forms/${form.id}/builder?preview=1`}>
        <FormThumbnail formType={form.form_type} variant="recent" />
      </Link>
      <div className="space-y-1.5 p-3">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/forms/${form.id}`} className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{form.name}</p>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label={t('dashboard.menuOpen')} />
              }
            >
              <MoreVertical aria-hidden="true" className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/forms/${form.id}`)}>
                {t('dashboard.actionEdit')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/forms/${form.id}/builder?preview=1`)}>
                {t('dashboard.actionPreview')}
              </DropdownMenuItem>
              <DropdownMenuItem disabled={isMutating} onClick={onDuplicate}>
                {t('dashboard.actionDuplicate')}
              </DropdownMenuItem>
              {form.status === 'draft' && (
                <DropdownMenuItem disabled={isMutating} onClick={onPublish}>
                  {t('dashboard.actionPublish')}
                </DropdownMenuItem>
              )}
              {form.status === 'published' && (
                <DropdownMenuItem disabled={isMutating} onClick={onClose}>
                  {t('dashboard.actionClose')}
                </DropdownMenuItem>
              )}
              {form.status !== 'archived' && (
                <DropdownMenuItem disabled={isMutating} onClick={onArchive}>
                  {t('dashboard.actionArchive')}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem disabled title={t('dashboard.comingSoon')}>
                {t('dashboard.actionResults')}
              </DropdownMenuItem>
              <DropdownMenuItem disabled title={t('dashboard.comingSoon')}>
                {t('dashboard.actionShare')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <Badge variant="secondary" className="text-[10px]">
            {t(STATUS_LABEL_KEYS[form.status])}
          </Badge>
          <span>
            {form.response_count} {t('dashboard.responseCount')} · {t('dashboard.updatedAt')}{' '}
            {new Date(form.updated_at).toLocaleDateString('es-ES')}
          </span>
        </div>
      </div>
    </div>
  )
}
