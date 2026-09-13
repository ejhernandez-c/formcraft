import { Trash2 } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { t } from '@/i18n'
import type { FormSection, FormSectionInput } from '@/services/formBuilder'

interface SectionHeaderCardProps {
  section: FormSection
  onSave: (data: FormSectionInput) => void
  onDelete: () => void
}

export function SectionHeaderCard({ section, onSave, onDelete }: SectionHeaderCardProps) {
  const { register, watch } = useForm<FormSectionInput>({
    defaultValues: { title: section.title ?? '', description: section.description ?? '' },
  })
  const { debounced } = useDebouncedCallback((values: FormSectionInput) => onSave(values), 600)

  useEffect(() => {
    const subscription = watch((values) => debounced(values as FormSectionInput))
    return () => subscription.unsubscribe()
  }, [watch, debounced])

  return (
    <div className="flex items-start gap-2 rounded-lg border-l-4 border-l-primary/50 bg-card p-4 shadow-sm">
      <div className="flex-1 space-y-1">
        <Input
          {...register('title')}
          placeholder={t('editor.sectionTitlePlaceholder')}
          className="border-none px-0 text-base font-semibold shadow-none focus-visible:ring-0"
        />
        <Textarea
          {...register('description')}
          rows={1}
          placeholder={t('editor.sectionDescriptionPlaceholder')}
          className="min-h-0 resize-none border-none px-0 text-sm text-muted-foreground shadow-none focus-visible:ring-0"
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={t('editor.deleteSection')}
        onClick={() => {
          if (window.confirm(t('editor.deleteSectionConfirm'))) {
            onDelete()
          }
        }}
      >
        <Trash2 aria-hidden="true" />
      </Button>
    </div>
  )
}
