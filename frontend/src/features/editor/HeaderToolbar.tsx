import { ImagePlus, Shuffle, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { t } from '@/i18n'
import { cn } from '@/lib/utils'

interface HeaderToolbarProps {
  onChangeImage: () => void
  onShuffleColor: () => void
  onDelete: () => void
  className?: string
}

const ANIMATED_ICON_BUTTON =
  'rounded-full transition-transform duration-150 ease-out hover:scale-110 focus-visible:scale-110'

// Floating pill anchored to the theme banner's bottom-left corner — see
// ThemeBanner.tsx for the positioning/visibility (hover, focus-within,
// selected) logic. Kept as its own component since ThemeBanner stays a
// small, otherwise-pure decorative piece.
export function HeaderToolbar({
  onChangeImage,
  onShuffleColor,
  onDelete,
  className,
}: HeaderToolbarProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full border bg-card p-1 shadow-md',
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={t('editor.headerChangeImage')}
        className={ANIMATED_ICON_BUTTON}
        onClick={(event) => {
          event.stopPropagation()
          onChangeImage()
        }}
      >
        <ImagePlus aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={t('editor.headerShuffleColor')}
        className={ANIMATED_ICON_BUTTON}
        onClick={(event) => {
          event.stopPropagation()
          onShuffleColor()
        }}
      >
        <Shuffle aria-hidden="true" />
      </Button>
      <div className="h-4 w-px bg-border" aria-hidden="true" />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={t('editor.headerDeleteBanner')}
        className={cn(
          ANIMATED_ICON_BUTTON,
          'hover:text-destructive focus-visible:text-destructive',
        )}
        onClick={(event) => {
          event.stopPropagation()
          onDelete()
        }}
      >
        <Trash2 aria-hidden="true" />
      </Button>
    </div>
  )
}
