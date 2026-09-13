import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ALL_CONTROLS, getControlDefinition } from '@/features/builder/controlTypes'
import { OptionsEditor } from '@/features/builder/OptionsEditor'
import type { ElementFormValues } from '@/features/builder/propertiesForm'
import { toApiPayload, toFormValues } from '@/features/builder/propertiesForm'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { t } from '@/i18n'
import { cn } from '@/lib/utils'
import type { FormElement, FormElementInput } from '@/services/formBuilder'

interface ElementCardProps {
  element: FormElement
  isSelected: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  onSelect: () => void
  onSave: (data: FormElementInput) => void
  onDelete: () => void
  onMove: (direction: -1 | 1) => void
}

export function ElementCard({
  element,
  isSelected,
  canMoveUp,
  canMoveDown,
  onSelect,
  onSave,
  onDelete,
  onMove,
}: ElementCardProps) {
  const { register, control, watch } = useForm<ElementFormValues>({
    defaultValues: toFormValues(element),
  })
  const { debounced } = useDebouncedCallback((values: ElementFormValues) => {
    onSave(toApiPayload(values, element.element_kind, element.control_type))
  }, 600)

  useEffect(() => {
    const subscription = watch((values) => debounced(values as ElementFormValues))
    return () => subscription.unsubscribe()
  }, [watch, debounced])

  const definition = getControlDefinition(element.control_type)
  const isContent = element.element_kind === 'content'

  return (
    <div
      role="group"
      onClick={onSelect}
      className={cn(
        'space-y-3 rounded-lg border bg-card p-4 shadow-sm',
        isSelected && 'border-l-4 border-l-primary ring-1 ring-primary/30',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {isContent ? (
          <ContentField register={register} controlType={element.control_type} />
        ) : (
          <Input
            {...register('label')}
            placeholder={t('editor.questionPlaceholder')}
            className="border-none px-0 text-base font-medium shadow-none focus-visible:ring-0"
          />
        )}

        {!isContent && <QuestionTypeSelect currentType={element.control_type} onSave={onSave} />}
      </div>

      {!isContent && (
        <>
          <Textarea
            {...register('help_text')}
            placeholder={t('editor.helpTextPlaceholder')}
            className="min-h-0 resize-none border-none px-0 text-sm text-muted-foreground shadow-none focus-visible:ring-0"
            rows={1}
          />
          <QuestionBody
            controlType={element.control_type}
            register={register}
            control={control}
            supportsOptions={Boolean(definition?.supportsOptions)}
          />
        </>
      )}

      <div className="flex items-center justify-between border-t pt-2">
        <div>
          {!isContent && (
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Controller
                control={control}
                name="required"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
              {t('editor.requiredField')}
            </label>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t('editor.moveUp')}
            disabled={!canMoveUp}
            onClick={(event) => {
              event.stopPropagation()
              onMove(-1)
            }}
          >
            <ChevronUp aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t('editor.moveDown')}
            disabled={!canMoveDown}
            onClick={(event) => {
              event.stopPropagation()
              onMove(1)
            }}
          >
            <ChevronDown aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t('editor.deleteElement')}
            onClick={(event) => {
              event.stopPropagation()
              onDelete()
            }}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function ContentField({
  register,
  controlType,
}: {
  register: ReturnType<typeof useForm<ElementFormValues>>['register']
  controlType: string
}) {
  if (controlType === 'divider') {
    return <hr className="w-full border-border" />
  }
  const sizeClass = controlType === 'heading' ? 'text-xl font-semibold' : 'text-sm'
  const definition = getControlDefinition(controlType)
  return (
    <Textarea
      {...register('label')}
      rows={1}
      placeholder={definition ? t(definition.labelKey) : ''}
      className={cn(
        'min-h-0 resize-none border-none px-0 shadow-none focus-visible:ring-0',
        sizeClass,
      )}
    />
  )
}

function QuestionTypeSelect({
  currentType,
  onSave,
}: {
  currentType: string
  onSave: (data: FormElementInput) => void
}) {
  const questionControls = ALL_CONTROLS.filter((control) => control.elementKind === 'question')

  return (
    <Select
      value={currentType}
      onValueChange={(value) => {
        const definition = questionControls.find((control) => control.controlType === value)
        if (!definition) return
        onSave({
          element_kind: 'question',
          control_type: definition.controlType,
          options: definition.supportsOptions
            ? [{ label: t('builder.optionLabelPlaceholder') }]
            : [],
        })
      }}
    >
      <SelectTrigger className="w-40 shrink-0" aria-label={t('editor.questionPlaceholder')}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {questionControls.map((control) => (
          <SelectItem key={control.controlType} value={control.controlType}>
            {t(control.labelKey)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function QuestionBody({
  controlType,
  register,
  control,
  supportsOptions,
}: {
  controlType: string
  register: ReturnType<typeof useForm<ElementFormValues>>['register']
  control: ReturnType<typeof useForm<ElementFormValues>>['control']
  supportsOptions: boolean
}) {
  if (supportsOptions) {
    return <OptionsEditor control={control} register={register} />
  }

  switch (controlType) {
    case 'number':
      return (
        <div className="flex gap-2">
          <Input
            type="number"
            {...register('numberMin')}
            placeholder={t('editor.minLabel')}
            className="w-24"
          />
          <Input
            type="number"
            {...register('numberMax')}
            placeholder={t('editor.maxLabel')}
            className="w-24"
          />
        </div>
      )
    case 'rating':
      return (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            {...register('ratingMin')}
            placeholder={t('editor.minLabel')}
            className="w-20"
          />
          <Input
            type="number"
            {...register('ratingMax')}
            placeholder={t('editor.maxLabel')}
            className="w-20"
          />
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Controller
              control={control}
              name="ratingAllowHalf"
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
            {t('editor.allowHalfLabel')}
          </label>
        </div>
      )
    case 'short_text':
      return <Input disabled placeholder={t('builder.control.shortText')} />
    case 'long_text':
      return <Textarea disabled placeholder={t('builder.control.longText')} />
    case 'email':
      return <Input disabled type="email" />
    case 'date':
      return <Input disabled type="date" />
    case 'yes_no':
      return (
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{t('builder.previewYes')}</span>
          <span>{t('builder.previewNo')}</span>
        </div>
      )
    default:
      return null
  }
}
