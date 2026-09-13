import { CalendarCheck, ClipboardList, File, FileText, Plus, UserPlus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { FormType } from '@/services/forms'

// Mock thumbnails only — not derived from a form's real content. Rendering
// actual content would need either section/element data embedded in the
// forms-list response or one extra API call per visible card; not worth it
// for a dashboard reskin. See docs/PHASES plan notes.
const TYPE_ICON: Record<FormType, LucideIcon> = {
  survey: ClipboardList,
  event_registration: CalendarCheck,
  registration: UserPlus,
  application: FileText,
  blank: File,
}

const TYPE_BAND_CLASSES: Record<FormType, string> = {
  survey: 'bg-violet-500',
  event_registration: 'bg-amber-500',
  registration: 'bg-sky-500',
  application: 'bg-emerald-500',
  blank: 'bg-slate-400',
}

interface FormThumbnailProps {
  formType: FormType
  variant: 'template' | 'recent'
}

export function FormThumbnail({ formType, variant }: FormThumbnailProps) {
  if (formType === 'blank' && variant === 'template') {
    return (
      <div className="flex h-24 w-full items-center justify-center rounded-t-lg border-b bg-white">
        <Plus className="size-8 text-primary" aria-hidden="true" />
      </div>
    )
  }

  const Icon = TYPE_ICON[formType]

  return (
    <div
      className={cn(
        'flex h-24 w-full flex-col justify-between rounded-t-lg p-3',
        TYPE_BAND_CLASSES[formType],
      )}
    >
      <Icon className="size-5 text-white" aria-hidden="true" />
      <div className="space-y-1">
        <div className="h-1.5 w-3/4 rounded-full bg-white/70" />
        <div className="h-1.5 w-1/2 rounded-full bg-white/50" />
      </div>
    </div>
  )
}
