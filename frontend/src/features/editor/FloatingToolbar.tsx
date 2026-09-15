import { ImagePlus, PlusCircle, Rows3, Type } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { t } from '@/i18n'

const ANIMATED_ICON_BUTTON =
  'transition-transform duration-150 ease-out hover:scale-110 focus-visible:scale-110'

interface FloatingToolbarProps {
  onAddQuestion: () => void
  onAddTitleBlock: () => void
  onAddImage: () => void
  onAddSection: () => void
  disabled: boolean
}

// Sticky next to the canvas rather than literally tracking the selected
// card's position — same functionality (acts on whichever card is
// selected), no scroll/resize position-tracking to keep correct. See the
// plan's scope decisions.
export function FloatingToolbar({
  onAddQuestion,
  onAddTitleBlock,
  onAddImage,
  onAddSection,
  disabled,
}: FloatingToolbarProps) {
  return (
    <div className="sticky top-20 flex w-12 shrink-0 flex-col gap-1 self-start rounded-lg border bg-card p-1.5 shadow-sm">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={t('editor.toolbarAddQuestion')}
        disabled={disabled}
        className={ANIMATED_ICON_BUTTON}
        onClick={onAddQuestion}
      >
        <PlusCircle aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={t('editor.toolbarAddTitleBlock')}
        disabled={disabled}
        className={ANIMATED_ICON_BUTTON}
        onClick={onAddTitleBlock}
      >
        <Type aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={t('editor.toolbarAddImage')}
        disabled={disabled}
        className={ANIMATED_ICON_BUTTON}
        onClick={onAddImage}
      >
        <ImagePlus aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={t('editor.toolbarAddSection')}
        className={ANIMATED_ICON_BUTTON}
        onClick={onAddSection}
      >
        <Rows3 aria-hidden="true" />
      </Button>
    </div>
  )
}
