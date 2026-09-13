import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { CreateFormDialog } from '@/features/dashboard/CreateFormDialog'
import { FormCard } from '@/features/dashboard/FormCard'
import { useAuth } from '@/features/auth/AuthContext'
import { t } from '@/i18n'
import { archiveForm, closeForm, duplicateForm, listForms, publishForm } from '@/services/forms'

export function DashboardPage() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)

  const formsQuery = useQuery({
    queryKey: ['forms'],
    queryFn: () => listForms(token as string),
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

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('dashboard.title')}</h1>
        <Button onClick={() => setDialogOpen(true)}>{t('dashboard.createButton')}</Button>
      </div>

      {formsQuery.isLoading && (
        <p className="text-sm text-muted-foreground">{t('dashboard.loading')}</p>
      )}
      {formsQuery.isError && <p className="text-sm text-destructive">{t('dashboard.loadError')}</p>}
      {formsQuery.data && formsQuery.data.items.length === 0 && (
        <p className="text-sm text-muted-foreground">{t('dashboard.empty')}</p>
      )}

      <div className="space-y-3">
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

      <CreateFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </main>
  )
}
