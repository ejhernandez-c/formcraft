import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Canvas } from '@/features/builder/Canvas'
import type { Selection } from '@/features/builder/Canvas'
import { ComponentPalette } from '@/features/builder/ComponentPalette'
import type { ControlDefinition } from '@/features/builder/controlTypes'
import { defaultSettingsFor } from '@/features/builder/controlTypes'
import { PreviewDialog } from '@/features/builder/PreviewDialog'
import { PropertiesPanel } from '@/features/builder/PropertiesPanel'
import { useAuth } from '@/features/auth/AuthContext'
import { t } from '@/i18n'
import type {
  FormElement,
  FormElementInput,
  FormSection,
  FormSectionInput,
} from '@/services/formBuilder'
import {
  createElement,
  createSection,
  deleteElement,
  deleteSection,
  listElements,
  listSections,
  reorderElements,
  reorderSections,
  updateElement,
  updateSection,
} from '@/services/formBuilder'

export function BuilderPage() {
  const { id } = useParams<{ id: string }>()
  const formId = id as string
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()

  const [selection, setSelection] = useState<Selection>(null)
  // Only tracks an *explicit* user choice — falls back to the first section
  // below so a freshly loaded form doesn't need a synced effect just to
  // pick a default target section.
  const [explicitActiveSectionId, setExplicitActiveSectionId] = useState<string | null>(null)
  // Lazily seeded from ?preview=1 (the dashboard's "Vista previa" shortcut)
  // so it opens immediately without a synced effect.
  const [previewOpen, setPreviewOpen] = useState(() => searchParams.get('preview') === '1')
  const createdFirstSection = useRef(false)

  const sectionsQuery = useQuery({
    queryKey: ['builder', formId, 'sections'],
    queryFn: () => listSections(token as string, formId),
    enabled: Boolean(token),
  })
  const elementsQuery = useQuery({
    queryKey: ['builder', formId, 'elements'],
    queryFn: () => listElements(token as string, formId),
    enabled: Boolean(token),
  })

  const invalidate = (): void => {
    queryClient.invalidateQueries({ queryKey: ['builder', formId, 'sections'] })
    queryClient.invalidateQueries({ queryKey: ['builder', formId, 'elements'] })
  }

  const createSectionMutation = useMutation({
    mutationFn: () => createSection(token as string, formId, {}),
    onSuccess: (section) => {
      invalidate()
      setExplicitActiveSectionId(section.id)
      setSelection({ kind: 'section', id: section.id })
    },
  })
  const updateSectionMutation = useMutation({
    mutationFn: ({ sectionId, data }: { sectionId: string; data: FormSectionInput }) =>
      updateSection(token as string, formId, sectionId, data),
    onSuccess: invalidate,
  })
  const deleteSectionMutation = useMutation({
    mutationFn: (sectionId: string) => deleteSection(token as string, formId, sectionId),
    onSuccess: () => {
      setSelection(null)
      invalidate()
    },
  })
  const reorderSectionsMutation = useMutation({
    mutationFn: (items: { id: string; order_index: number }[]) =>
      reorderSections(token as string, formId, items),
    onSuccess: invalidate,
  })

  const createElementMutation = useMutation({
    mutationFn: ({ sectionId, data }: { sectionId: string; data: FormElementInput }) =>
      createElement(token as string, formId, sectionId, data),
    onSuccess: (element) => {
      invalidate()
      setSelection({ kind: 'element', id: element.id })
    },
  })
  const updateElementMutation = useMutation({
    mutationFn: ({ elementId, data }: { elementId: string; data: FormElementInput }) =>
      updateElement(token as string, formId, elementId, data),
    onSuccess: invalidate,
  })
  const deleteElementMutation = useMutation({
    mutationFn: (elementId: string) => deleteElement(token as string, formId, elementId),
    onSuccess: () => {
      setSelection(null)
      invalidate()
    },
  })
  const reorderElementsMutation = useMutation({
    mutationFn: (items: { id: string; section_id: string; order_index: number }[]) =>
      reorderElements(token as string, formId, items),
    onSuccess: invalidate,
  })

  const sections = useMemo(
    () => [...(sectionsQuery.data ?? [])].sort((a, b) => a.order_index - b.order_index),
    [sectionsQuery.data],
  )
  const elementsBySection = useMemo(() => {
    const map = new Map<string, FormElement[]>()
    for (const element of elementsQuery.data ?? []) {
      const list = map.get(element.section_id) ?? []
      list.push(element)
      map.set(element.section_id, list)
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.order_index - b.order_index)
    }
    return map
  }, [elementsQuery.data])

  const activeSectionId = explicitActiveSectionId ?? sections[0]?.id ?? null

  // A fresh form has no sections yet — create the first one automatically
  // so the palette has somewhere to add content, instead of asking the
  // creator to click "add section" before they can add anything else.
  useEffect(() => {
    if (
      sectionsQuery.isSuccess &&
      sections.length === 0 &&
      !createdFirstSection.current &&
      !createSectionMutation.isPending
    ) {
      createdFirstSection.current = true
      createSectionMutation.mutate()
    }
  }, [sectionsQuery.isSuccess, sections, createSectionMutation])

  const selectedElement =
    selection?.kind === 'element'
      ? ((elementsQuery.data ?? []).find((element) => element.id === selection.id) ?? null)
      : null
  const selectedSection =
    selection?.kind === 'section'
      ? (sections.find((section) => section.id === selection.id) ?? null)
      : null

  function handleAddControl(definition: ControlDefinition): void {
    if (!activeSectionId) return
    createElementMutation.mutate({
      sectionId: activeSectionId,
      data: {
        element_kind: definition.elementKind,
        control_type: definition.controlType,
        settings: defaultSettingsFor(definition.controlType),
        validation: definition.elementKind === 'question' ? { required: false } : {},
        options: definition.supportsOptions ? [{ label: t('builder.optionLabelPlaceholder') }] : [],
      },
    })
  }

  function handleMoveElement(element: FormElement, direction: -1 | 1): void {
    const siblings = elementsBySection.get(element.section_id) ?? []
    const index = siblings.findIndex((item) => item.id === element.id)
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= siblings.length) return
    const target = siblings[targetIndex]
    reorderElementsMutation.mutate([
      { id: element.id, section_id: element.section_id, order_index: target.order_index },
      { id: target.id, section_id: target.section_id, order_index: element.order_index },
    ])
  }

  function handleMoveSection(section: FormSection, direction: -1 | 1): void {
    const index = sections.findIndex((item) => item.id === section.id)
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= sections.length) return
    const target = sections[targetIndex]
    reorderSectionsMutation.mutate([
      { id: section.id, order_index: target.order_index },
      { id: target.id, order_index: section.order_index },
    ])
  }

  const isSaving = updateElementMutation.isPending || updateSectionMutation.isPending
  const justSaved = updateElementMutation.isSuccess || updateSectionMutation.isSuccess

  // !token (auth not resolved yet) is treated the same as isLoading: a
  // disabled query's own isLoading is false (nothing is fetching), so
  // without this the component would briefly render as "loaded" with
  // empty data before the queries actually start — see docs/PHASES/PHASE-3.md.
  if (!token || sectionsQuery.isLoading || elementsQuery.isLoading) {
    return <p className="p-6 text-sm text-muted-foreground">{t('builder.loading')}</p>
  }
  if (sectionsQuery.isError || elementsQuery.isError) {
    return <p className="p-6 text-sm text-destructive">{t('builder.loadError')}</p>
  }

  return (
    <div className="flex h-[calc(100vh-8.5rem)] flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <Link to={`/forms/${formId}`} className="text-sm text-muted-foreground hover:underline">
          ← {t('builder.backToForm')}
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground" role="status">
            {isSaving ? t('builder.saving') : justSaved ? t('builder.saved') : ''}
          </span>
          <Button type="button" variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
            {t('builder.previewButton')}
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <ComponentPalette onAdd={handleAddControl} disabled={!activeSectionId} />
        <Canvas
          sections={sections}
          elementsBySection={elementsBySection}
          selection={selection}
          activeSectionId={activeSectionId}
          onSelect={setSelection}
          onSetActiveSection={setExplicitActiveSectionId}
          onDeleteSection={(sectionId) => deleteSectionMutation.mutate(sectionId)}
          onDeleteElement={(elementId) => deleteElementMutation.mutate(elementId)}
          onMoveElement={handleMoveElement}
          onMoveSection={handleMoveSection}
          onAddSection={() => createSectionMutation.mutate()}
        />
        <PropertiesPanel
          selectedElement={selectedElement}
          selectedSection={selectedSection}
          onSaveElement={(elementId, data) => updateElementMutation.mutate({ elementId, data })}
          onSaveSection={(sectionId, data) => updateSectionMutation.mutate({ sectionId, data })}
        />
      </div>

      <PreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        sections={sections}
        elementsBySection={elementsBySection}
      />
    </div>
  )
}
