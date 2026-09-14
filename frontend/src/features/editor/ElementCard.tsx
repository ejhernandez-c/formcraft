import {
  AlignJustify,
  AlignLeft,
  Calendar,
  ChevronDown,
  ChevronDownSquare,
  ChevronUp,
  CircleDot,
  Hash,
  Mail,
  SquareCheck,
  Star,
  ToggleLeft,
  Trash2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { getControlDefinition } from '@/features/builder/controlTypes'
import type { QuestionControlType } from '@/features/builder/controlTypes'
import { OptionsEditor } from '@/features/builder/OptionsEditor'
import type { ElementFormValues } from '@/features/builder/propertiesForm'
import { toApiPayload, toFormValues } from '@/features/builder/propertiesForm'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import type { TranslationKey } from '@/i18n'
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
  const { register, control, watch, getValues, reset } = useForm<ElementFormValues>({
    defaultValues: toFormValues(element),
  })
  const { debounced, cancel } = useDebouncedCallback((values: ElementFormValues) => {
    onSave(toApiPayload(values, element.element_kind, element.control_type))
  }, 600)

  useEffect(() => {
    const subscription = watch((values) => debounced(values as ElementFormValues))
    return () => subscription.unsubscribe()
  }, [watch, debounced])

  const definition = getControlDefinition(element.control_type)
  const isContent = element.element_kind === 'content'

  // Switching control type used to send a minimal payload (element_kind +
  // control_type + options only) straight to onSave, bypassing toApiPayload
  // entirely — since PUT is a full-resource replace (docs/API.md §4), that
  // silently wiped label/help_text/settings on every type switch. Routing
  // through the same toApiPayload as every other save fixes that, and
  // cancel() drops any autosave still pending from whatever was being typed
  // right before the switch, so it can't land afterward with stale data.
  function handleTypeChange(option: QuestionTypeOption): void {
    cancel()
    const newDefinition = getControlDefinition(option.controlType)
    const nextValues: ElementFormValues = {
      ...getValues(),
      numberMin: '',
      numberMax: '',
      numberDecimals: '',
      ratingMin: '1',
      ratingMax: '5',
      ratingAllowHalf: false,
      imageUrl: '',
      headingLevel: '2',
      options: newDefinition?.supportsOptions
        ? [{ label: t('builder.optionLabelPlaceholder'), value: '' }]
        : [],
    }
    reset(nextValues)
    onSave(toApiPayload(nextValues, 'question', option.controlType))
  }

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

        {!isContent && (
          <QuestionTypeSelect currentType={element.control_type} onSelectType={handleTypeChange} />
        )}
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

interface QuestionTypeOption {
  controlType: QuestionControlType
  labelKey: TranslationKey
  icon: LucideIcon
}

// Grouped like the reference spec, but limited to the 10 control types
// Formcraft actually supports — the spec's File upload / Linear scale /
// grid / Time rows have no backing control_type (CLAUDE.md §17 defers
// File Upload/Time, grids aren't in scope at all), so a creator picking
// one would just get rejected by the backend. Not shown, not stubbed as
// "coming soon," since none of those are on an approved roadmap phase yet.
const QUESTION_TYPE_GROUPS: QuestionTypeOption[][] = [
  [
    { controlType: 'short_text', labelKey: 'builder.control.shortText', icon: AlignLeft },
    { controlType: 'long_text', labelKey: 'builder.control.longText', icon: AlignJustify },
    { controlType: 'number', labelKey: 'builder.control.number', icon: Hash },
    { controlType: 'email', labelKey: 'builder.control.email', icon: Mail },
  ],
  [
    { controlType: 'radio', labelKey: 'builder.control.radio', icon: CircleDot },
    { controlType: 'checkbox', labelKey: 'builder.control.checkbox', icon: SquareCheck },
    { controlType: 'dropdown', labelKey: 'builder.control.dropdown', icon: ChevronDownSquare },
    { controlType: 'yes_no', labelKey: 'builder.control.yesNo', icon: ToggleLeft },
  ],
  [{ controlType: 'rating', labelKey: 'builder.control.rating', icon: Star }],
  [{ controlType: 'date', labelKey: 'builder.control.date', icon: Calendar }],
]
const ALL_QUESTION_TYPE_OPTIONS = QUESTION_TYPE_GROUPS.flat()

function QuestionTypeSelect({
  currentType,
  onSelectType,
}: {
  currentType: string
  onSelectType: (option: QuestionTypeOption) => void
}) {
  const current = ALL_QUESTION_TYPE_OPTIONS.find((option) => option.controlType === currentType)
  const CurrentIcon = current?.icon ?? CircleDot

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-44 shrink-0 justify-between"
            aria-label={t('editor.questionTypeLabel')}
          />
        }
      >
        <span className="flex min-w-0 items-center gap-2">
          <CurrentIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">
            {current ? t(current.labelKey) : t('editor.questionTypeLabel')}
          </span>
        </span>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
        {QUESTION_TYPE_GROUPS.map((group, groupIndex) => (
          <div key={groupIndex}>
            {groupIndex > 0 && <DropdownMenuSeparator />}
            {group.map((option) => (
              <DropdownMenuItem
                key={option.controlType}
                onClick={() => onSelectType(option)}
                className={cn(option.controlType === currentType && 'bg-primary/10')}
              >
                <option.icon aria-hidden="true" className="size-4 text-muted-foreground" />
                {t(option.labelKey)}
              </DropdownMenuItem>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
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
