import { Trash2 } from 'lucide-react'
import type { Control, FieldArrayWithId, UseFormRegister } from 'react-hook-form'
import { useFieldArray } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ElementFormValues } from '@/features/builder/propertiesForm'
import { t } from '@/i18n'

interface OptionsEditorProps {
  control: Control<ElementFormValues>
  register: UseFormRegister<ElementFormValues>
}

export function OptionsEditor({ control, register }: OptionsEditorProps) {
  const { fields, append, remove } = useFieldArray({ control, name: 'options' })

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">{t('builder.optionsTitle')}</span>
      {fields.length === 0 && (
        <p className="text-xs text-destructive">{t('builder.optionsMinError')}</p>
      )}
      <ul className="space-y-2">
        {fields.map((field: FieldArrayWithId<ElementFormValues, 'options'>, index: number) => (
          <li key={field.id} className="flex items-center gap-2">
            <Input
              aria-label={t('builder.optionLabelPlaceholder')}
              placeholder={t('builder.optionLabelPlaceholder')}
              {...register(`options.${index}.label` as const)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t('builder.removeOption')}
              onClick={() => remove(index)}
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ label: '', value: '' })}
      >
        {t('builder.addOption')}
      </Button>
    </div>
  )
}
