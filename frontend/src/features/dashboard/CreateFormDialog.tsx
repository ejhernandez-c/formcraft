import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/features/auth/AuthContext'
import type { TranslationKey } from '@/i18n'
import { t } from '@/i18n'
import type { FormType } from '@/services/forms'
import { createForm } from '@/services/forms'

const FORM_TYPE_OPTIONS: { value: FormType; labelKey: TranslationKey }[] = [
  { value: 'survey', labelKey: 'dashboard.formTypeSurvey' },
  { value: 'event_registration', labelKey: 'dashboard.formTypeEventRegistration' },
  { value: 'registration', labelKey: 'dashboard.formTypeRegistration' },
  { value: 'application', labelKey: 'dashboard.formTypeApplication' },
  { value: 'blank', labelKey: 'dashboard.formTypeBlank' },
]

interface CreateFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateFormDialog({ open, onOpenChange }: CreateFormDialogProps) {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [formType, setFormType] = useState<FormType>('blank')

  const mutation = useMutation({
    mutationFn: () => createForm(token as string, name, formType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] })
      setName('')
      setFormType('blank')
      onOpenChange(false)
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    mutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('dashboard.createDialogTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="create-form-name">{t('dashboard.createDialogNameLabel')}</Label>
            <Input
              id="create-form-name"
              required
              placeholder={t('dashboard.createDialogNamePlaceholder')}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="create-form-type">{t('dashboard.createDialogTypeLabel')}</Label>
            <Select value={formType} onValueChange={(value) => setFormType(value as FormType)}>
              <SelectTrigger id="create-form-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORM_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {mutation.isError && (
            <p className="text-sm text-destructive">{t('dashboard.createError')}</p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('dashboard.createDialogCancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {t('dashboard.createDialogSubmit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
