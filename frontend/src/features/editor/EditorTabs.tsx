import { useSearchParams } from 'react-router-dom'

import type { TranslationKey } from '@/i18n'
import { t } from '@/i18n'
import { cn } from '@/lib/utils'

export type EditorTab = 'questions' | 'responses' | 'settings'

const TABS: { value: EditorTab; labelKey: TranslationKey }[] = [
  { value: 'questions', labelKey: 'editor.tabQuestions' },
  { value: 'responses', labelKey: 'editor.tabResponses' },
  { value: 'settings', labelKey: 'editor.tabSettings' },
]

export function useEditorTab(): EditorTab {
  const [searchParams] = useSearchParams()
  const value = searchParams.get('tab')
  return value === 'responses' || value === 'settings' ? value : 'questions'
}

export function EditorTabs() {
  const activeTab = useEditorTab()
  const [searchParams, setSearchParams] = useSearchParams()

  function selectTab(tab: EditorTab): void {
    const next = new URLSearchParams(searchParams)
    next.set('tab', tab)
    setSearchParams(next)
  }

  return (
    <nav className="border-b bg-background px-6">
      <ul className="flex gap-6">
        {TABS.map((tab) => (
          <li key={tab.value}>
            <button
              type="button"
              onClick={() => selectTab(tab.value)}
              className={cn(
                'border-b-2 py-3 text-sm font-medium',
                activeTab === tab.value
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {t(tab.labelKey)}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
