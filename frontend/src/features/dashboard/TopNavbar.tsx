import { Menu, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/AuthContext'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { t } from '@/i18n'

export function TopNavbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [searchValue, setSearchValue] = useState(searchParams.get('search') ?? '')

  const { debounced: debouncedSearch } = useDebouncedCallback((value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) {
      next.set('search', value)
    } else {
      next.delete('search')
    }
    navigate({ pathname: '/', search: next.toString() })
  }, 400)

  return (
    <header className="border-b bg-background">
      <div className="h-[3px] bg-primary" />
      <div className="flex items-center gap-4 px-4 py-2">
        <div className="flex shrink-0 items-center gap-3">
          <Menu aria-hidden="true" className="size-5 text-muted-foreground" />
          <span className="text-lg font-medium">{t('app.title')}</span>
        </div>

        <div className="mx-auto flex w-full max-w-xl items-center gap-2 rounded-full bg-muted px-4 py-2">
          <Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          <input
            type="search"
            value={searchValue}
            onChange={(event) => {
              setSearchValue(event.target.value)
              debouncedSearch(event.target.value)
            }}
            placeholder={t('dashboard.searchPlaceholder')}
            aria-label={t('dashboard.searchPlaceholder')}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {user && (
            <Avatar seed={user.id} label={user.name} ariaLabel={t('dashboard.userMenuLabel')} />
          )}
          <Button variant="outline" size="sm" onClick={logout}>
            {t('auth.logout')}
          </Button>
        </div>
      </div>
    </header>
  )
}
