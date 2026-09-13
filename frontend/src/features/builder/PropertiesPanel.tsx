import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { getControlDefinition } from '@/features/builder/controlTypes'
import { OptionsEditor } from '@/features/builder/OptionsEditor'
import type { ElementFormValues } from '@/features/builder/propertiesForm'
import { toApiPayload, toFormValues } from '@/features/builder/propertiesForm'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { t } from '@/i18n'
import type {
  FormElement,
  FormElementInput,
  FormSection,
  FormSectionInput,
} from '@/services/formBuilder'

interface PropertiesPanelProps {
  selectedElement: FormElement | null
  selectedSection: FormSection | null
  onSaveElement: (elementId: string, data: FormElementInput) => void
  onSaveSection: (sectionId: string, data: FormSectionInput) => void
}

export function PropertiesPanel({
  selectedElement,
  selectedSection,
  onSaveElement,
  onSaveSection,
}: PropertiesPanelProps) {
  if (selectedElement) {
    return (
      <ElementProperties
        key={selectedElement.id}
        element={selectedElement}
        onSave={onSaveElement}
      />
    )
  }
  if (selectedSection) {
    return (
      <SectionProperties
        key={selectedSection.id}
        section={selectedSection}
        onSave={onSaveSection}
      />
    )
  }
  return (
    <aside
      className="flex h-full flex-col gap-3 border-l p-4"
      aria-label={t('builder.propertiesTitle')}
    >
      <h2 className="text-sm font-semibold">{t('builder.propertiesTitle')}</h2>
      <p className="text-sm text-muted-foreground">{t('builder.propertiesEmpty')}</p>
    </aside>
  )
}

function SectionProperties({
  section,
  onSave,
}: {
  section: FormSection
  onSave: (sectionId: string, data: FormSectionInput) => void
}) {
  const { register, watch } = useForm<FormSectionInput>({
    defaultValues: { title: section.title ?? '', description: section.description ?? '' },
  })
  const { debounced } = useDebouncedCallback((values: FormSectionInput) => {
    onSave(section.id, values)
  }, 600)

  useEffect(() => {
    const subscription = watch((values) => debounced(values as FormSectionInput))
    return () => subscription.unsubscribe()
  }, [watch, debounced])

  return (
    <aside
      className="flex h-full flex-col gap-4 border-l p-4"
      aria-label={t('builder.propertiesTitle')}
    >
      <h2 className="text-sm font-semibold">{t('builder.propertiesSectionTitle')}</h2>
      <div className="space-y-1.5">
        <Label htmlFor="section-title">{t('builder.sectionTitlePlaceholder')}</Label>
        <Input id="section-title" {...register('title')} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="section-description">{t('builder.sectionDescriptionPlaceholder')}</Label>
        <Textarea id="section-description" {...register('description')} />
      </div>
    </aside>
  )
}

function ElementProperties({
  element,
  onSave,
}: {
  element: FormElement
  onSave: (elementId: string, data: FormElementInput) => void
}) {
  const definition = getControlDefinition(element.control_type)
  const { register, control, watch } = useForm<ElementFormValues>({
    defaultValues: toFormValues(element),
  })
  const { debounced } = useDebouncedCallback((values: ElementFormValues) => {
    onSave(element.id, toApiPayload(values, element.element_kind, element.control_type))
  }, 600)

  useEffect(() => {
    const subscription = watch((values) => debounced(values as ElementFormValues))
    return () => subscription.unsubscribe()
  }, [watch, debounced])

  return (
    <aside
      className="flex h-full flex-col gap-4 overflow-y-auto border-l p-4"
      aria-label={t('builder.propertiesTitle')}
    >
      <h2 className="text-sm font-semibold">
        {t('builder.propertiesTitle')} — {definition && t(definition.labelKey)}
      </h2>

      <div className="space-y-1.5">
        <Label htmlFor="element-label">{t('builder.labelField')}</Label>
        <Input id="element-label" {...register('label')} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="element-help">{t('builder.helpTextField')}</Label>
        <Textarea id="element-help" {...register('help_text')} />
      </div>

      {element.element_kind === 'question' && (
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="element-required">{t('builder.requiredField')}</Label>
          <Controller
            control={control}
            name="required"
            render={({ field }) => (
              <Switch
                id="element-required"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>
      )}

      {element.control_type === 'number' && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="number-min">{t('builder.minLabel')}</Label>
            <Input id="number-min" type="number" {...register('numberMin')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="number-max">{t('builder.maxLabel')}</Label>
            <Input id="number-max" type="number" {...register('numberMax')} />
          </div>
        </div>
      )}

      {element.control_type === 'rating' && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="rating-min">{t('builder.minLabel')}</Label>
            <Input id="rating-min" type="number" {...register('ratingMin')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rating-max">{t('builder.maxLabel')}</Label>
            <Input id="rating-max" type="number" {...register('ratingMax')} />
          </div>
          <div className="col-span-2 flex items-center justify-between gap-4">
            <Label htmlFor="rating-half">{t('builder.allowHalfLabel')}</Label>
            <Controller
              control={control}
              name="ratingAllowHalf"
              render={({ field }) => (
                <Switch id="rating-half" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>
        </div>
      )}

      {element.control_type === 'image' && (
        <div className="space-y-1.5">
          <Label htmlFor="image-url">{t('builder.imageUrlLabel')}</Label>
          <Input id="image-url" type="url" {...register('imageUrl')} />
        </div>
      )}

      {element.control_type === 'heading' && (
        <div className="space-y-1.5">
          <Label htmlFor="heading-level">{t('builder.headingLevelLabel')}</Label>
          <Controller
            control={control}
            name="headingLevel"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="heading-level" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t('builder.headingLevelLarge')}</SelectItem>
                  <SelectItem value="2">{t('builder.headingLevelMedium')}</SelectItem>
                  <SelectItem value="3">{t('builder.headingLevelSmall')}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      )}

      {definition?.supportsOptions && <OptionsEditor control={control} register={register} />}
    </aside>
  )
}
