import { Button } from '@/components/ui/button'
import { CONTENT_CONTROLS, QUESTION_CONTROLS } from '@/features/builder/controlTypes'
import type { ControlDefinition } from '@/features/builder/controlTypes'
import { t } from '@/i18n'

interface ComponentPaletteProps {
  onAdd: (definition: ControlDefinition) => void
  disabled: boolean
}

export function ComponentPalette({ onAdd, disabled }: ComponentPaletteProps) {
  return (
    <aside className="w-56 shrink-0 space-y-4 overflow-y-auto border-r p-4">
      {disabled && <p className="text-xs text-muted-foreground">{t('builder.addToSectionHint')}</p>}
      <PaletteGroup
        titleKey="builder.paletteContentTitle"
        controls={CONTENT_CONTROLS}
        onAdd={onAdd}
        disabled={disabled}
      />
      <PaletteGroup
        titleKey="builder.paletteQuestionsTitle"
        controls={QUESTION_CONTROLS}
        onAdd={onAdd}
        disabled={disabled}
      />
    </aside>
  )
}

function PaletteGroup({
  titleKey,
  controls,
  onAdd,
  disabled,
}: {
  titleKey: Parameters<typeof t>[0]
  controls: ControlDefinition[]
  onAdd: (definition: ControlDefinition) => void
  disabled: boolean
}) {
  return (
    <div className="space-y-1.5">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase">{t(titleKey)}</h2>
      <div className="grid grid-cols-1 gap-1">
        {controls.map((control) => (
          <Button
            key={control.controlType}
            type="button"
            variant="outline"
            size="sm"
            className="justify-start"
            disabled={disabled}
            onClick={() => onAdd(control)}
          >
            {t(control.labelKey)}
          </Button>
        ))}
      </div>
    </div>
  )
}
