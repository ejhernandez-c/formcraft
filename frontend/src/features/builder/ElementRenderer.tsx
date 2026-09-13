import { Star } from 'lucide-react'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { t } from '@/i18n'
import type { FormElement } from '@/services/formBuilder'

interface ElementRendererProps {
  element: FormElement
}

const HEADING_CLASSES: Record<number, string> = {
  1: 'text-2xl font-semibold',
  2: 'text-xl font-semibold',
  3: 'text-lg font-medium',
}

export function ElementRenderer({ element }: ElementRendererProps) {
  const isRequired = element.element_kind === 'question' && Boolean(element.validation?.required)

  if (element.element_kind === 'content') {
    return <ContentRenderer element={element} />
  }

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">
        {element.label || t('builder.untitledElement')}
        {isRequired && (
          <span aria-hidden="true" className="text-destructive">
            {' '}
            *
          </span>
        )}
      </label>
      {element.help_text && <p className="text-xs text-muted-foreground">{element.help_text}</p>}
      <QuestionRenderer element={element} />
    </div>
  )
}

function ContentRenderer({ element }: { element: FormElement }) {
  switch (element.control_type) {
    case 'heading': {
      const level = Number(element.settings.level) || 2
      return <p className={HEADING_CLASSES[level] ?? HEADING_CLASSES[2]}>{element.label}</p>
    }
    case 'paragraph':
      return <p className="text-sm">{element.label}</p>
    case 'instruction':
      return (
        <p className="rounded-md bg-muted p-2 text-sm text-muted-foreground">{element.label}</p>
      )
    case 'image': {
      const url = typeof element.settings.url === 'string' ? element.settings.url : ''
      return url ? (
        <img src={url} alt={element.label ?? ''} className="max-h-48 rounded-md object-contain" />
      ) : (
        <div className="flex h-24 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
          {t('builder.imageUrlLabel')}
        </div>
      )
    }
    case 'divider':
      return <hr className="border-border" />
    default:
      return null
  }
}

function QuestionRenderer({ element }: { element: FormElement }) {
  switch (element.control_type) {
    case 'short_text':
      return <Input disabled />
    case 'long_text':
      return <Textarea disabled />
    case 'number':
      return <Input type="number" disabled />
    case 'email':
      return <Input type="email" disabled />
    case 'date':
      return <Input type="date" disabled />
    case 'dropdown':
      return (
        <Select disabled>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {element.options.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    case 'radio':
      return (
        <div className="space-y-1.5">
          {element.options.map((option) => (
            <label key={option.id} className="flex items-center gap-2 text-sm">
              <input type="radio" disabled className="size-4" />
              {option.label}
            </label>
          ))}
        </div>
      )
    case 'checkbox':
      return (
        <div className="space-y-1.5">
          {element.options.map((option) => (
            <label key={option.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" disabled className="size-4" />
              {option.label}
            </label>
          ))}
        </div>
      )
    case 'yes_no':
      return (
        <div className="flex gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" disabled className="size-4" />
            {t('builder.previewYes')}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" disabled className="size-4" />
            {t('builder.previewNo')}
          </label>
        </div>
      )
    case 'rating': {
      const max = Number(element.settings.max) || 5
      return (
        <div className="flex gap-1" aria-hidden="true">
          {Array.from({ length: max }, (_, index) => (
            <Star key={index} className="size-5 text-muted-foreground" />
          ))}
        </div>
      )
    }
    default:
      return null
  }
}
