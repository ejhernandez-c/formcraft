import { MessageSquareText, RectangleHorizontal, Video } from 'lucide-react'

import { darken } from '@/lib/color'

// Matches ThemeDialog.tsx's fallback so a form with no theme set yet still
// shows a coherent banner instead of an undefined/black one.
const DEFAULT_PRIMARY = '#7c3aed'

const WATERMARK_ICONS = [MessageSquareText, Video, RectangleHorizontal]
const TILE_COUNT = 24

interface ThemeBannerProps {
  theme: Record<string, unknown>
}

// Purely decorative — no interactive elements, per the spec. Full-width,
// sits above the constrained-width canvas column in QuestionsTab.tsx.
export function ThemeBanner({ theme }: ThemeBannerProps) {
  const primary = typeof theme.primary_color === 'string' ? theme.primary_color : DEFAULT_PRIMARY
  const accent = darken(primary, 0.35)
  const iconColor = darken(primary, 0.15)

  return (
    <div aria-hidden="true" className="pointer-events-none w-full select-none">
      <div style={{ backgroundColor: accent }} className="h-[5px] w-full" />
      <div
        style={{ backgroundColor: primary }}
        className="relative h-[180px] w-full overflow-hidden"
      >
        <div className="absolute inset-0 grid grid-cols-6 gap-6 p-6 sm:grid-cols-8">
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
    </div>
  )
}
