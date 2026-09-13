import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { defaultSettingsFor } from '@/features/builder/controlTypes'
import { ElementCard } from '@/features/editor/ElementCard'
import { FloatingToolbar } from '@/features/editor/FloatingToolbar'
import { SectionHeaderCard } from '@/features/editor/SectionHeaderCard'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { t } from '@/i18n'
import type {
  FormElement,
  FormElementInput,
  FormSection,
  FormSectionInput,
} from '@/services/formBuilder'
import type { FormDetail } from '@/services/forms'

type Selection = { kind: 'section'; id: string } | { kind: 'element'; id: string } | null

interface QuestionsTabProps {
  form: FormDetail
  sections: FormSection[]
  elementsBySection: Map<string, FormElement[]>
  onSaveForm: (data: { name: string; description: string | null }) => void
  onCreateSection: () => void
  onSaveSection: (sectionId: string, data: FormSectionInput) => void
  onDeleteSection: (sectionId: string) => void
  onMoveSection: (section: FormSection, direction: -1 | 1) => void
  onCreateElement: (sectionId: string, data: FormElementInput) => void
  onSaveElement: (elementId: string, data: FormElementInput) => void
  onDeleteElement: (elementId: string) => void
  onMoveElement: (element: FormElement, direction: -1 | 1) => void
}

export function QuestionsTab({
  form,
  sections,
  elementsBySection,
  onSaveForm,
  onCreateSection,
  onSaveSection,
  onDeleteSection,
  onMoveSection,
  onCreateElement,
  onSaveElement,
  onDeleteElement,
  onMoveElement,
}: QuestionsTabProps) {
  const [selection, setSelection] = useState<Selection>(null)

  function resolveActiveSectionId(): string | null {
    if (selection?.kind === 'section') return selection.id
    if (selection?.kind === 'element') {
      const owner = sections.find((section) =>
        elementsBySection.get(section.id)?.some((el) => el.id === selection.id),
      )
      if (owner) return owner.id
    }
    return sections[0]?.id ?? null
  }
  const activeSectionId = resolveActiveSectionId()

  function handleAddQuestion(): void {
    if (!activeSectionId) return
    onCreateElement(activeSectionId, { element_kind: 'question', control_type: 'short_text' })
  }

  function handleAddTitleBlock(): void {
    if (!activeSectionId) return
    onCreateElement(activeSectionId, {
      element_kind: 'content',
      control_type: 'heading',
      settings: defaultSettingsFor('heading'),
    })
  }

  function handleAddImage(): void {
    if (!activeSectionId) return
    onCreateElement(activeSectionId, {
      element_kind: 'content',
      control_type: 'image',
      settings: defaultSettingsFor('image'),
    })
  }

  return (
    <div className="mx-auto flex max-w-4xl gap-4 p-6">
      <div className="flex-1 space-y-4">
        <FormHeaderCard form={form} onSave={onSaveForm} />

        {sections.map((section, sectionIndex) => {
          const showSectionHeader = sections.length > 1 || Boolean(section.title)
          return (
            <div key={section.id} className="space-y-4">
              {showSectionHeader && (
                <SectionHeaderCard
                  section={section}
                  onSave={(data) => onSaveSection(section.id, data)}
                  onDelete={() => onDeleteSection(section.id)}
                />
              )}
              {(elementsBySection.get(section.id) ?? []).map((element, index) => (
                <div
                  key={element.id}
                  onClick={() => setSelection({ kind: 'element', id: element.id })}
                >
                  <ElementCard
                    element={element}
                    isSelected={selection?.kind === 'element' && selection.id === element.id}
                    canMoveUp={index > 0}
                    canMoveDown={index < (elementsBySection.get(section.id)?.length ?? 0) - 1}
                    onSelect={() => setSelection({ kind: 'element', id: element.id })}
                    onSave={(data) => onSaveElement(element.id, data)}
                    onDelete={() => onDeleteElement(element.id)}
                    onMove={(direction) => onMoveElement(element, direction)}
                  />
                </div>
              ))}
              {sectionIndex < sections.length - 1 && (
                <MoveSectionRow
                  canMoveUp={sectionIndex > 0}
                  canMoveDown={sectionIndex < sections.length - 1}
                  onMove={(direction) => onMoveSection(section, direction)}
                />
              )}
            </div>
          )
        })}
      </div>

      <FloatingToolbar
        disabled={!activeSectionId}
        onAddQuestion={handleAddQuestion}
        onAddTitleBlock={handleAddTitleBlock}
        onAddImage={handleAddImage}
        onAddSection={onCreateSection}
      />
    </div>
  )
}

function MoveSectionRow({
  canMoveUp,
  canMoveDown,
  onMove,
}: {
  canMoveUp: boolean
  canMoveDown: boolean
  onMove: (direction: -1 | 1) => void
}) {
  // Sections are moved from this thin divider between them rather than from
  // inside SectionHeaderCard, since a single-section form usually shows no
  // section header at all (see showSectionHeader above).
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <hr className="flex-1 border-border" />
      <button
        type="button"
        disabled={!canMoveUp}
        onClick={() => onMove(-1)}
        className="disabled:opacity-30"
      >
        {t('editor.moveUp')}
      </button>
      <button
        type="button"
        disabled={!canMoveDown}
        onClick={() => onMove(1)}
        className="disabled:opacity-30"
      >
        {t('editor.moveDown')}
      </button>
      <hr className="flex-1 border-border" />
    </div>
  )
}

function FormHeaderCard({
  form,
  onSave,
}: {
  form: FormDetail
  onSave: (data: { name: string; description: string | null }) => void
}) {
  const { register, watch } = useForm({
    defaultValues: { name: form.name, description: form.description ?? '' },
  })
  const { debounced } = useDebouncedCallback((values: { name: string; description: string }) => {
    if (!values.name.trim()) return
    onSave({ name: values.name, description: values.description || null })
  }, 600)

  useEffect(() => {
    const subscription = watch((values) =>
      debounced({ name: values.name ?? '', description: values.description ?? '' }),
    )
    return () => subscription.unsubscribe()
  }, [watch, debounced])

  return (
    <div className="space-y-2 rounded-lg border-l-4 border-l-primary bg-card p-6 shadow-sm ring-1 ring-primary/20">
      <Input
        {...register('name')}
        placeholder={t('editor.formTitlePlaceholder')}
        className="border-none px-0 text-2xl font-light shadow-none focus-visible:ring-0"
      />
      <hr className="border-border" />
      <Textarea
        {...register('description')}
        rows={1}
        placeholder={t('editor.formDescriptionPlaceholder')}
        className="min-h-0 resize-none border-none px-0 text-sm text-muted-foreground shadow-none focus-visible:ring-0"
      />
    </div>
  )
}
