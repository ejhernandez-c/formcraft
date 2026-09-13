import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/features/auth/AuthContext'
import type { TranslationKey } from '@/i18n'
import { t } from '@/i18n'
import { datetimeLocalToIso, isoToDatetimeLocal } from '@/lib/datetime'
import type { FormEditValues } from '@/schemas/formEdit'
import { formEditSchema } from '@/schemas/formEdit'
import type { FormDetail, FormStatus } from '@/services/forms'
import { archiveForm, closeForm, getForm, publishForm, updateForm } from '@/services/forms'

const STATUS_LABEL_KEYS: Record<FormStatus, TranslationKey> = {
  draft: 'dashboard.statusDraft',
  published: 'dashboard.statusPublished',
  closed: 'dashboard.statusClosed',
  archived: 'dashboard.statusArchived',
}

function toFormValues(form: FormDetail): FormEditValues {
  return {
    name: form.name,
    identification_type: form.identification_type,
    allow_multiple_responses: form.allow_multiple_responses,
    response_limit_enabled: form.response_limit_enabled,
    max_responses: form.max_responses,
    one_response_per_email: form.one_response_per_email,
    open_at: form.open_at,
    close_at: form.close_at,
  }
}

export function FormEditPage() {
  const { id } = useParams<{ id: string }>()
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [saved, setSaved] = useState(false)

  const formQuery = useQuery({
    queryKey: ['forms', id],
    queryFn: () => getForm(token as string, id as string),
    enabled: Boolean(token && id),
  })

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormEditValues>({
    resolver: zodResolver(formEditSchema),
    defaultValues: {
      name: '',
      identification_type: 'anonymous',
      allow_multiple_responses: false,
      response_limit_enabled: false,
      max_responses: null,
      one_response_per_email: false,
      open_at: null,
      close_at: null,
    },
  })

  useEffect(() => {
    if (formQuery.data) {
      reset(toFormValues(formQuery.data))
    }
  }, [formQuery.data, reset])

  const invalidate = (): void => {
    queryClient.invalidateQueries({ queryKey: ['forms', id] })
    queryClient.invalidateQueries({ queryKey: ['forms'] })
  }

  const saveMutation = useMutation({
    mutationFn: (values: FormEditValues) =>
      updateForm(token as string, id as string, {
        ...values,
        settings: formQuery.data?.settings ?? {},
        theme: formQuery.data?.theme ?? {},
      }),
    onSuccess: () => {
      invalidate()
      setSaved(true)
    },
  })

  const publishMutation = useMutation({
    mutationFn: () => publishForm(token as string, id as string),
    onSuccess: invalidate,
  })
  const closeMutation = useMutation({
    mutationFn: () => closeForm(token as string, id as string),
    onSuccess: invalidate,
  })
  const archiveMutation = useMutation({
    mutationFn: () => archiveForm(token as string, id as string),
    onSuccess: invalidate,
  })

  const responseLimitEnabled = watch('response_limit_enabled')

  if (formQuery.isLoading) {
    return <p className="p-6 text-sm text-muted-foreground">{t('forms.loading')}</p>
  }
  if (formQuery.isError || !formQuery.data) {
    return <p className="p-6 text-sm text-destructive">{t('forms.loadError')}</p>
  }

  const form = formQuery.data
  const isLifecycleMutating =
    publishMutation.isPending || closeMutation.isPending || archiveMutation.isPending

  function onSubmit(values: FormEditValues): void {
    setSaved(false)
    saveMutation.mutate(values)
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <Link to="/" className="text-sm text-muted-foreground hover:underline">
          ← {t('forms.backToDashboard')}
        </Link>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t('forms.editTitle')}</h1>
          <p className="text-xs text-muted-foreground">
            {t('forms.publicUrlLabel')}: /f/{form.slug}
          </p>
        </div>
        <Badge variant="secondary">{t(STATUS_LABEL_KEYS[form.status])}</Badge>
      </div>

      <section className="space-y-2 rounded-lg border p-4">
        <h2 className="text-sm font-medium">{t('forms.lifecycleTitle')}</h2>
        <p className="text-xs text-muted-foreground">
          {form.status === 'draft' && t('forms.lifecyclePublishHint')}
          {form.status === 'closed' && t('forms.lifecycleClosedHint')}
          {form.status === 'archived' && t('forms.lifecycleArchivedHint')}
        </p>
        <div className="flex gap-2">
          {form.status === 'draft' && (
            <Button
              size="sm"
              disabled={isLifecycleMutating}
              onClick={() => publishMutation.mutate()}
            >
              {t('dashboard.actionPublish')}
            </Button>
          )}
          {form.status === 'published' && (
            <Button
              size="sm"
              variant="outline"
              disabled={isLifecycleMutating}
              onClick={() => closeMutation.mutate()}
            >
              {t('dashboard.actionClose')}
            </Button>
          )}
          {form.status !== 'archived' && (
            <Button
              size="sm"
              variant="outline"
              disabled={isLifecycleMutating}
              onClick={() => archiveMutation.mutate()}
            >
              {t('dashboard.actionArchive')}
            </Button>
          )}
        </div>
        {(publishMutation.isError || closeMutation.isError || archiveMutation.isError) && (
          <p className="text-sm text-destructive">{t('forms.actionError')}</p>
        )}
      </section>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="edit-name">{t('forms.nameLabel')}</Label>
          <Input id="edit-name" {...register('name')} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-identification">{t('forms.identificationTypeLabel')}</Label>
          <Controller
            control={control}
            name="identification_type"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="edit-identification" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anonymous">{t('forms.identificationAnonymous')}</SelectItem>
                  <SelectItem value="identified">{t('forms.identificationIdentified')}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="edit-allow-multiple">{t('forms.allowMultipleResponsesLabel')}</Label>
          <Controller
            control={control}
            name="allow_multiple_responses"
            render={({ field }) => (
              <Switch
                id="edit-allow-multiple"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="edit-response-limit">{t('forms.responseLimitEnabledLabel')}</Label>
          <Controller
            control={control}
            name="response_limit_enabled"
            render={({ field }) => (
              <Switch
                id="edit-response-limit"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>

        {responseLimitEnabled && (
          <div className="space-y-1.5">
            <Label htmlFor="edit-max-responses">{t('forms.maxResponsesLabel')}</Label>
            <Controller
              control={control}
              name="max_responses"
              render={({ field }) => (
                <Input
                  id="edit-max-responses"
                  type="number"
                  min={1}
                  value={field.value ?? ''}
                  onChange={(event) =>
                    field.onChange(event.target.value ? Number(event.target.value) : null)
                  }
                />
              )}
            />
            {errors.max_responses && (
              <p className="text-sm text-destructive">{t('forms.maxResponsesRequired')}</p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="edit-one-per-email">{t('forms.oneResponsePerEmailLabel')}</Label>
          <Controller
            control={control}
            name="one_response_per_email"
            render={({ field }) => (
              <Switch
                id="edit-one-per-email"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-open-at">{t('forms.openAtLabel')}</Label>
          <Controller
            control={control}
            name="open_at"
            render={({ field }) => (
              <Input
                id="edit-open-at"
                type="datetime-local"
                value={isoToDatetimeLocal(field.value)}
                onChange={(event) => field.onChange(datetimeLocalToIso(event.target.value))}
              />
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-close-at">{t('forms.closeAtLabel')}</Label>
          <Controller
            control={control}
            name="close_at"
            render={({ field }) => (
              <Input
                id="edit-close-at"
                type="datetime-local"
                value={isoToDatetimeLocal(field.value)}
                onChange={(event) => field.onChange(datetimeLocalToIso(event.target.value))}
              />
            )}
          />
        </div>

        {saveMutation.isError && <p className="text-sm text-destructive">{t('forms.saveError')}</p>}
        {saved && !saveMutation.isPending && (
          <p className="text-sm text-green-600">{t('forms.saved')}</p>
        )}

        <Button type="submit" disabled={saveMutation.isPending}>
          {t('forms.saveButton')}
        </Button>
      </form>
    </main>
  )
}
