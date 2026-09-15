import { MessageSquareText, RectangleHorizontal, Video } from 'lucide-react'

import { HeaderToolbar } from '@/features/editor/HeaderToolbar'
import { t } from '@/i18n'
import { darken } from '@/lib/color'
import { cn } from '@/lib/utils'

// Matches ThemeDialog.tsx's fallback so a form with no theme set yet still
// shows a coherent banner instead of an undefined/black one.
const DEFAULT_PRIMARY = '#7c3aed'

const WATERMARK_ICONS = [MessageSquareText, Video, RectangleHorizontal]
const TILE_COUNT = 24

interface ThemeBannerProps {
  theme: Record<string, unknown>
  isSelected: boolean
  onSelect: () => void
  onChangeImage: () => void
  onShuffleColor: () => void
  onDeleteHeader: () => void
}

// Full-width, sits above the constrained-width canvas column in
// QuestionsTab.tsx. The outer wrapper is the selectable/hoverable unit
// (role="group", keyboard-operable) that reveals HeaderToolbar — only the
// watermark icon grid below stays purely decorative/non-interactive.
export function ThemeBanner({
  theme,
  isSelected,
  onSelect,
  onChangeImage,
  onShuffleColor,
  onDeleteHeader,
}: ThemeBannerProps) {
  const primary = typeof theme.primary_color === 'string' ? theme.primary_color : DEFAULT_PRIMARY
  const accent = darken(primary, 0.35)
  const iconColor = darken(primary, 0.15)

  return (
    <div
      role="group"
      tabIndex={0}
      aria-label={t('editor.headerBannerLabel')}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect()
        }
      }}
      className={cn(
        'group relative w-full cursor-pointer select-none',
        isSelected && 'ring-2 ring-primary ring-offset-2',
      )}
    >
      <div style={{ backgroundColor: accent }} className="h-[5px] w-full" />
      <div
        style={{ backgroundColor: primary }}
        className="relative h-[180px] w-full overflow-hidden"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 grid grid-cols-6 gap-6 p-6 sm:grid-cols-8"
        >
          {Array.from({ length: TILE_COUNT }, (_, index) => {
            const Icon = WATERMARK_ICONS[index % WATERMARK_ICONS.length]
            const offsetClass =
              index % 3 === 0 ? 'translate-y-2' : index % 3 === 1 ? '-translate-y-2' : ''
            return (
              <Icon
                key={index}
                style={{ color: iconColor }}
                className={`size-6 opacity-25 ${offsetClass}`}
              />
            )
          })}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-1/2">
        <div className="mx-auto max-w-4xl px-6">
          <HeaderToolbar
            onChangeImage={onChangeImage}
            onShuffleColor={onShuffleColor}
            onDelete={onDeleteHeader}
            className={cn(
              'pointer-events-none opacity-0 transition-opacity duration-150 ease-out',
              'group-hover:pointer-events-auto group-hover:opacity-100',
              'group-focus-within:pointer-events-auto group-focus-within:opacity-100',
              isSelected && 'pointer-events-auto opacity-100',
            )}
          />
        </div>
      </div>
    </div>
  )
}
