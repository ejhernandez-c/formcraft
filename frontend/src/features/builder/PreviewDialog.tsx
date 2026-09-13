import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ElementRenderer } from '@/features/builder/ElementRenderer'
import { t } from '@/i18n'
import { cn } from '@/lib/utils'
import type { FormElement, FormSection } from '@/services/formBuilder'

type DeviceWidth = 'mobile' | 'tablet' | 'desktop'

const WIDTH_CLASSES: Record<DeviceWidth, string> = {
  mobile: 'max-w-[375px]',
  tablet: 'max-w-[768px]',
  desktop: 'max-w-[100%]',
}

interface PreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sections: FormSection[]
  elementsBySection: Map<string, FormElement[]>
}

export function PreviewDialog({
  open,
  onOpenChange,
  sections,
  elementsBySection,
}: PreviewDialogProps) {
  const [device, setDevice] = useState<DeviceWidth>('mobile')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('builder.previewTitle')}</DialogTitle>
        </DialogHeader>

        <div className="flex justify-center gap-2">
          <DeviceButton
            device="mobile"
            current={device}
            onSelect={setDevice}
            labelKey="builder.previewMobile"
          />
          <DeviceButton
            device="tablet"
            current={device}
            onSelect={setDevice}
            labelKey="builder.previewTablet"
          />
          <DeviceButton
            device="desktop"
            current={device}
            onSelect={setDevice}
            labelKey="builder.previewDesktop"
          />
        </div>

        <div className="max-h-[70vh] overflow-y-auto rounded-lg border bg-background p-4">
          <div className={cn('mx-auto space-y-6', WIDTH_CLASSES[device])}>
            {sections.length === 0 && (
              <p className="text-sm text-muted-foreground">{t('builder.previewEmpty')}</p>
            )}
            {sections.map((section) => (
              <div key={section.id} className="space-y-4">
                {(section.title || section.description) && (
                  <div>
                    {section.title && <h3 className="text-base font-semibold">{section.title}</h3>}
                    {section.description && (
                      <p className="text-sm text-muted-foreground">{section.description}</p>
                    )}
                  </div>
                )}
                {(elementsBySection.get(section.id) ?? []).map((element) => (
                  <ElementRenderer key={element.id} element={element} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DeviceButton({
  device,
  current,
  onSelect,
  labelKey,
}: {
  device: DeviceWidth
  current: DeviceWidth
  onSelect: (device: DeviceWidth) => void
  labelKey: Parameters<typeof t>[0]
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={current === device ? 'default' : 'outline'}
      aria-pressed={current === device}
      onClick={() => onSelect(device)}
    >
      {t(labelKey)}
    </Button>
  )
}
