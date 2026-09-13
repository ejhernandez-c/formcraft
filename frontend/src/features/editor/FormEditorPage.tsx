import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useSearchParams } from 'react-router-dom'

import { useAuth } from '@/features/auth/AuthContext'
import { PreviewDialog } from '@/features/builder/PreviewDialog'
import { EditorNavbar } from '@/features/editor/EditorNavbar'
import { EditorTabs, useEditorTab } from '@/features/editor/EditorTabs'
import { QuestionsTab } from '@/features/editor/QuestionsTab'
import { ResponsesTabPlaceholder } from '@/features/editor/ResponsesTabPlaceholder'
import { SettingsTab } from '@/features/editor/SettingsTab'
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
import { getForm, updateForm } from '@/services/forms'

export function FormEditorPage() {
  const { id } = useParams<{ id: string }>()
  const formId = id as string
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const activeTab = useEditorTab()
  const [searchParams] = useSearchParams()
  const [previewOpen, setPreviewOpen] = useState(() => searchParams.get('preview') === '1')
  const createdFirstSection = useRef(false)

  const formQuery = useQuery({
    queryKey: ['forms', formId],
    queryFn: () => getForm(token as string, formId),
    enabled: Boolean(token),
  })
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

  const invalidateBuilder = (): void => {
    queryClient.invalidateQueries({ queryKey: ['builder', formId, 'sections'] })
    queryClient.invalidateQueries({ queryKey: ['builder', formId, 'elements'] })
  }
  const invalidateForm = (): void => {
    queryClient.invalidateQueries({ queryKey: ['forms', formId] })
    queryClient.invalidateQueries({ queryKey: ['forms'] })
  }

  const saveFormMutation = useMutation({
    mutationFn: (data: { name: string; description: string | null }) => {
      const current = formQuery.data
      if (!current) throw new Error('Form not loaded yet')
      return updateForm(token as string, formId, {
        name: data.name,
        description: data.description,
        identification_type: current.identification_type,
        allow_multiple_responses: current.allow_multiple_responses,
        response_limit_enabled: current.response_limit_enabled,
        max_responses: current.max_responses,
        one_response_per_email: current.one_response_per_email,
        open_at: current.open_at,
        close_at: current.close_at,
        settings: current.settings,
        theme: current.theme,
      })
    },
    onSuccess: invalidateForm,
  })

  const createSectionMutation = useMutation({
    mutationFn: () => createSection(token as string, formId, {}),
    onSuccess: invalidateBuilder,
  })
  const updateSectionMutation = useMutation({
    mutationFn: ({ sectionId, data }: { sectionId: string; data: FormSectionInput }) =>
      updateSection(token as string, formId, sectionId, data),
    onSuccess: invalidateBuilder,
  })
  const deleteSectionMutation = useMutation({
    mutationFn: (sectionId: string) => deleteSection(token as string, formId, sectionId),
    onSuccess: invalidateBuilder,
  })
  const reorderSectionsMutation = useMutation({
    mutationFn: (items: { id: string; order_index: number }[]) =>
      reorderSections(token as string, formId, items),
    onSuccess: invalidateBuilder,
  })

  const createElementMutation = useMutation({
    mutationFn: ({ sectionId, data }: { sectionId: string; data: FormElementInput }) =>
      createElement(token as string, formId, sectionId, data),
    onSuccess: invalidateBuilder,
  })
  const updateElementMutation = useMutation({
    mutationFn: ({ elementId, data }: { elementId: string; data: FormElementInput }) =>
      updateElement(token as string, formId, elementId, data),
    onSuccess: invalidateBuilder,
  })
  const deleteElementMutation = useMutation({
    mutationFn: (elementId: string) => deleteElement(token as string, formId, elementId),
    onSuccess: invalidateBuilder,
  })
  const reorderElementsMutation = useMutation({
    mutationFn: (items: { id: string; section_id: string; order_index: number }[]) =>
      reorderElements(token as string, formId, items),
    onSuccess: invalidateBuilder,
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
    for (const list of map.values()) list.sort((a, b) => a.order_index - b.order_index)
    return map
  }, [elementsQuery.data])

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

  if (!token || formQuery.isLoading || sectionsQuery.isLoading || elementsQuery.isLoading) {
    return <p className="p-6 text-sm text-muted-foreground">{t('editor.loading')}</p>
  }
  if (formQuery.isError || !formQuery.data || sectionsQuery.isError || elementsQuery.isError) {
    return <p className="p-6 text-sm text-destructive">{t('editor.loadError')}</p>
  }

  const form = formQuery.data

  return (
    <div className="min-h-screen bg-muted/30">
      <EditorNavbar form={form} onOpenPreview={() => setPreviewOpen(true)} />
      <EditorTabs />

      {activeTab === 'questions' && (
        <QuestionsTab
          form={form}
          sections={sections}
          elementsBySection={elementsBySection}
          onSaveForm={(data) => saveFormMutation.mutate(data)}
          onCreateSection={() => createSectionMutation.mutate()}
          onSaveSection={(sectionId, data) => updateSectionMutation.mutate({ sectionId, data })}
          onDeleteSection={(sectionId) => deleteSectionMutation.mutate(sectionId)}
          onMoveSection={handleMoveSection}
          onCreateElement={(sectionId, data) => createElementMutation.mutate({ sectionId, data })}
          onSaveElement={(elementId, data) => updateElementMutation.mutate({ elementId, data })}
          onDeleteElement={(elementId) => deleteElementMutation.mutate(elementId)}
          onMoveElement={handleMoveElement}
        />
      )}
      {activeTab === 'responses' && <ResponsesTabPlaceholder />}
      {activeTab === 'settings' && <SettingsTab form={form} />}

      <PreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        sections={sections}
        elementsBySection={elementsBySection}
      />
    </div>
  )
}
