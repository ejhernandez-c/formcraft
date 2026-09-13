import { ArrowDownAZ } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/AuthContext'
import { FormCard } from '@/features/dashboard/FormCard'
import { TemplateGallery } from '@/features/dashboard/TemplateGallery'
import { t } from '@/i18n'
import { archiveForm, closeForm, duplicateForm, listForms, publishForm } from '@/services/forms'

export function DashboardPage() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  const search = searchParams.get('search') ?? undefined
  const sort = searchParams.get('sort') ?? undefined

  const formsQuery = useQuery({
    queryKey: ['forms', search, sort],
    queryFn: () => listForms(token as string, { search, sort }),
    enabled: Boolean(token),
  })

  const invalidate = (): void => {
    queryClient.invalidateQueries({ queryKey: ['forms'] })
  }

  const publishMutation = useMutation({
    mutationFn: (id: string) => publishForm(token as string, id),
    onSuccess: invalidate,
  })
  const closeMutation = useMutation({
    mutationFn: (id: string) => closeForm(token as string, id),
    onSuccess: invalidate,
  })
  const archiveMutation = useMutation({
    mutationFn: (id: string) => archiveForm(token as string, id),
    onSuccess: invalidate,
  })
  const duplicateMutation = useMutation({
    mutationFn: (id: string) => duplicateForm(token as string, id),
    onSuccess: invalidate,
  })

  const isMutating =
    publishMutation.isPending ||
    closeMutation.isPending ||
    archiveMutation.isPending ||
    duplicateMutation.isPending

  function toggleSort(): void {
    const next = new URLSearchParams(searchParams)
    if (sort === 'name') {
      next.delete('sort')
    } else {
      next.set('sort', 'name')
    }
    setSearchParams(next)
  }

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-6">
      <TemplateGallery />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">
            {t('dashboard.recentFormsTitle')}
          </h2>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('dashboard.sortAZ')}
            aria-pressed={sort === 'name'}
            onClick={toggleSort}
          >
            <ArrowDownAZ aria-hidden="true" className="size-4" />
          </Button>
        </div>

        {formsQuery.isLoading && (
          <p className="text-sm text-muted-foreground">{t('dashboard.loading')}</p>
        )}
        {formsQuery.isError && (
          <p className="text-sm text-destructive">{t('dashboard.loadError')}</p>
        )}
        {formsQuery.data && formsQuery.data.items.length === 0 && (
          <p className="text-sm text-muted-foreground">{t('dashboard.empty')}</p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {formsQuery.data?.items.map((form) => (
            <FormCard
              key={form.id}
              form={form}
              isMutating={isMutating}
              onPublish={() => publishMutation.mutate(form.id)}
              onClose={() => closeMutation.mutate(form.id)}
              onArchive={() => archiveMutation.mutate(form.id)}
              onDuplicate={() => duplicateMutation.mutate(form.id)}
            />
          ))}
        </div>
      </section>
    </main>
  )
}
