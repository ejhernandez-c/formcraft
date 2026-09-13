import { ChevronDown, ChevronUp, GripVertical, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getControlDefinition } from '@/features/builder/controlTypes'
import { t } from '@/i18n'
import { cn } from '@/lib/utils'
import type { FormElement, FormSection } from '@/services/formBuilder'

export type Selection = { kind: 'section'; id: string } | { kind: 'element'; id: string } | null

interface CanvasProps {
  sections: FormSection[]
  elementsBySection: Map<string, FormElement[]>
  selection: Selection
  activeSectionId: string | null
  onSelect: (selection: Selection) => void
  onSetActiveSection: (sectionId: string) => void
  onDeleteSection: (sectionId: string) => void
  onDeleteElement: (elementId: string) => void
  onMoveElement: (element: FormElement, direction: -1 | 1) => void
  onMoveSection: (section: FormSection, direction: -1 | 1) => void
  onAddSection: () => void
}

export function Canvas({
  sections,
  elementsBySection,
  selection,
  activeSectionId,
  onSelect,
  onSetActiveSection,
  onDeleteSection,
  onDeleteElement,
  onMoveElement,
  onMoveSection,
  onAddSection,
}: CanvasProps) {
  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4">
      {sections.length === 0 && (
        <p className="text-sm text-muted-foreground">{t('builder.emptyCanvas')}</p>
      )}
      {sections.map((section, sectionIndex) => (
        <SectionCard
          key={section.id}
          section={section}
          elements={elementsBySection.get(section.id) ?? []}
          isActive={activeSectionId === section.id}
          isSelected={selection?.kind === 'section' && selection.id === section.id}
          selectedElementId={selection?.kind === 'element' ? selection.id : null}
          canMoveUp={sectionIndex > 0}
          canMoveDown={sectionIndex < sections.length - 1}
          onSelectSection={() => {
            onSetActiveSection(section.id)
            onSelect({ kind: 'section', id: section.id })
          }}
          onSelectElement={(elementId) => {
            onSetActiveSection(section.id)
            onSelect({ kind: 'element', id: elementId })
          }}
          onDeleteSection={() => onDeleteSection(section.id)}
          onDeleteElement={onDeleteElement}
          onMoveElement={onMoveElement}
          onMoveSection={(direction) => onMoveSection(section, direction)}
        />
      ))}
      <Button type="button" variant="outline" onClick={onAddSection}>
        {t('builder.addSection')}
      </Button>
    </div>
  )
}

interface SectionCardProps {
  section: FormSection
  elements: FormElement[]
  isActive: boolean
  isSelected: boolean
  selectedElementId: string | null
  canMoveUp: boolean
  canMoveDown: boolean
  onSelectSection: () => void
  onSelectElement: (elementId: string) => void
  onDeleteSection: () => void
  onDeleteElement: (elementId: string) => void
  onMoveElement: (element: FormElement, direction: -1 | 1) => void
  onMoveSection: (direction: -1 | 1) => void
}

function SectionCard({
  section,
  elements,
  isActive,
  isSelected,
  selectedElementId,
  canMoveUp,
  canMoveDown,
  onSelectSection,
  onSelectElement,
  onDeleteSection,
  onDeleteElement,
  onMoveElement,
  onMoveSection,
}: SectionCardProps) {
  return (
    <section
      className={cn(
        'rounded-lg border p-3',
        isActive && 'ring-2 ring-primary/40',
        isSelected && 'border-primary',
      )}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onSelectSection}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onSelectSection()
          }
        }}
        className="mb-2 flex items-center justify-between gap-2 rounded-md px-1 py-1 text-left hover:bg-muted"
      >
        <div>
          <p className="text-sm font-medium">
            {section.title || t('builder.sectionTitlePlaceholder')}
          </p>
          {section.description && (
            <p className="text-xs text-muted-foreground">{section.description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t('builder.moveUp')}
            disabled={!canMoveUp}
            onClick={(event) => {
              event.stopPropagation()
              onMoveSection(-1)
            }}
          >
            <ChevronUp aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t('builder.moveDown')}
            disabled={!canMoveDown}
            onClick={(event) => {
              event.stopPropagation()
              onMoveSection(1)
            }}
          >
            <ChevronDown aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t('builder.deleteSection')}
            onClick={(event) => {
              event.stopPropagation()
              if (window.confirm(t('builder.deleteSectionConfirm'))) {
                onDeleteSection()
              }
            }}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      </div>

      {elements.length === 0 && (
        <p className="px-1 text-xs text-muted-foreground">{t('builder.emptySection')}</p>
      )}

      <ul className="space-y-1">
        {elements.map((element, index) => (
          <li key={element.id}>
            <ElementRow
              element={element}
              isSelected={selectedElementId === element.id}
              canMoveUp={index > 0}
              canMoveDown={index < elements.length - 1}
              onSelect={() => onSelectElement(element.id)}
              onDelete={() => onDeleteElement(element.id)}
              onMove={(direction) => onMoveElement(element, direction)}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

interface ElementRowProps {
  element: FormElement
  isSelected: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  onSelect: () => void
  onDelete: () => void
  onMove: (direction: -1 | 1) => void
}

function ElementRow({
  element,
  isSelected,
  canMoveUp,
  canMoveDown,
  onSelect,
  onDelete,
  onMove,
}: ElementRowProps) {
  const definition = getControlDefinition(element.control_type)
  const isRequired = element.element_kind === 'question' && Boolean(element.validation?.required)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect()
        }
      }}
      className={cn(
        'flex items-center gap-2 rounded-md border px-2 py-2 text-left hover:bg-muted',
        isSelected && 'border-primary bg-muted',
      )}
    >
      <GripVertical aria-hidden="true" className="shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{element.label || t('builder.untitledElement')}</p>
        <p className="text-xs text-muted-foreground">{definition && t(definition.labelKey)}</p>
      </div>
      {isRequired && <Badge variant="secondary">{t('builder.requiredBadge')}</Badge>}
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t('builder.moveUp')}
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
          aria-label={t('builder.moveDown')}
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
          aria-label={t('builder.deleteElement')}
          onClick={(event) => {
            event.stopPropagation()
            onDelete()
          }}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
