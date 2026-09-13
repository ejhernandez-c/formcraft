import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'

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
import { t } from '@/i18n'
import { datetimeLocalToIso, isoToDatetimeLocal } from '@/lib/datetime'
import type { FormEditValues } from '@/schemas/formEdit'
import { formEditSchema } from '@/schemas/formEdit'
import type { FormDetail } from '@/services/forms'
import { updateForm } from '@/services/forms'

function toFormValues(form: FormDetail): FormEditValues {
  return {
    identification_type: form.identification_type,
    allow_multiple_responses: form.allow_multiple_responses,
    response_limit_enabled: form.response_limit_enabled,
    max_responses: form.max_responses,
    one_response_per_email: form.one_response_per_email,
    open_at: form.open_at,
    close_at: form.close_at,
  }
}

interface SettingsTabProps {
  form: FormDetail
}

export function SettingsTab({ form }: SettingsTabProps) {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [saved, setSaved] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormEditValues>({
    resolver: zodResolver(formEditSchema),
    defaultValues: toFormValues(form),
  })

  useEffect(() => {
    reset(toFormValues(form))
  }, [form, reset])

  const saveMutation = useMutation({
    mutationFn: (values: FormEditValues) =>
      updateForm(token as string, form.id, {
        ...values,
        name: form.name,
        description: form.description,
        settings: form.settings,
        theme: form.theme,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms', form.id] })
      queryClient.invalidateQueries({ queryKey: ['forms'] })
      setSaved(true)
    },
  })

  const responseLimitEnabled = watch('response_limit_enabled')

  function onSubmit(values: FormEditValues): void {
    setSaved(false)
    saveMutation.mutate(values)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-2xl space-y-4 p-6">
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
  )
}
