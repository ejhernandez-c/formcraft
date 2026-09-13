import { useState } from 'react'

import { CreateFormDialog } from '@/features/dashboard/CreateFormDialog'
import { FormThumbnail } from '@/features/dashboard/FormThumbnail'
import type { TranslationKey } from '@/i18n'
import { t } from '@/i18n'
import type { FormType } from '@/services/forms'

// Formcraft has exactly 5 form_types (blank included), so this is 5 cards,
// not 6 — the extra "generic" template card from a Google-Forms-style
// gallery doesn't map to anything real here; inventing a 6th template with
// no backing form_type would mean fabricating content, not reskinning.
const TEMPLATES: { formType: FormType; labelKey: TranslationKey }[] = [
  { formType: 'blank', labelKey: 'dashboard.blankTemplateLabel' },
  { formType: 'survey', labelKey: 'dashboard.formTypeSurvey' },
  { formType: 'event_registration', labelKey: 'dashboard.formTypeEventRegistration' },
  { formType: 'registration', labelKey: 'dashboard.formTypeRegistration' },
  { formType: 'application', labelKey: 'dashboard.formTypeApplication' },
]

export function TemplateGallery() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<FormType>('blank')

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">
        {t('dashboard.templateGalleryTitle')}
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {TEMPLATES.map((template) => (
          <button
            key={template.formType}
            type="button"
            className="overflow-hidden rounded-lg border bg-card text-left shadow-sm transition-shadow hover:shadow-md"
            onClick={() => {
              setSelectedType(template.formType)
              setDialogOpen(true)
            }}
          >
            <FormThumbnail formType={template.formType} variant="template" />
            <p className="px-3 py-2 text-sm">{t(template.labelKey)}</p>
          </button>
        ))}
      </div>

      {/* key forces a remount per template so CreateFormDialog's internal
          formType state re-seeds from initialFormType on each selection. */}
      <CreateFormDialog
        key={selectedType}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialFormType={selectedType}
      />
    </section>
  )
}
