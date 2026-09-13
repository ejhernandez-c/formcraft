import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { TranslationKey } from '@/i18n'
import { t } from '@/i18n'
import type { FormDetail } from '@/services/forms'

interface PublishDialogProps {
  form: FormDetail
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isPending: boolean
}

const IDENTIFICATION_LABEL_KEYS: Record<FormDetail['identification_type'], TranslationKey> = {
  anonymous: 'forms.identificationAnonymous',
  identified: 'forms.identificationIdentified',
}

// A lightweight confirm step, not a reproduction of the whole Settings tab —
// shows what's already configured there and links to it rather than
// duplicating every field inside a modal.
export function PublishDialog({
  form,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: PublishDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('editor.publishDialogTitle')}</DialogTitle>
        </DialogHeader>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">
              {t('editor.publishDialogSummaryIdentification')}
            </dt>
            <dd>{t(IDENTIFICATION_LABEL_KEYS[form.identification_type])}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t('editor.publishDialogSummaryCapacity')}</dt>
            <dd>
              {form.response_limit_enabled && form.max_responses
                ? form.max_responses
                : t('editor.publishDialogSummaryNoLimit')}
            </dd>
          </div>
        </dl>
        <Link
          to={`/forms/${form.id}?tab=settings`}
          className="text-sm text-primary hover:underline"
          onClick={() => onOpenChange(false)}
        >
          {t('editor.publishDialogConfigureLink')}
        </Link>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('editor.publishDialogCancel')}
          </Button>
          <Button type="button" disabled={isPending} onClick={onConfirm}>
            {t('editor.publishDialogConfirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
