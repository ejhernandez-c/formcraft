import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/features/auth/AuthContext'
import { t } from '@/i18n'
import type { FormDetail } from '@/services/forms'
import { updateForm } from '@/services/forms'

interface ThemeDialogProps {
  form: FormDetail
  open: boolean
  onOpenChange: (open: boolean) => void
}

function colorFromTheme(theme: Record<string, unknown>, key: string, fallback: string): string {
  const value = theme[key]
  return typeof value === 'string' ? value : fallback
}

// Minimal theming — a color picker only, no presets/logo/font/width. Full
// theming (docs/UX.md §5) is Phase 4 scope; this is a down payment that
// writes to the already-existing Form.theme JSONB.
export function ThemeDialog({ form, open, onOpenChange }: ThemeDialogProps) {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [primary, setPrimary] = useState(() =>
    colorFromTheme(form.theme, 'primary_color', '#7c3aed'),
  )
  const [secondary, setSecondary] = useState(() =>
    colorFromTheme(form.theme, 'secondary_color', '#f3f0fc'),
  )

  const mutation = useMutation({
    mutationFn: () =>
      updateForm(token as string, form.id, {
        name: form.name,
        description: form.description,
        identification_type: form.identification_type,
        allow_multiple_responses: form.allow_multiple_responses,
        response_limit_enabled: form.response_limit_enabled,
        max_responses: form.max_responses,
        one_response_per_email: form.one_response_per_email,
        open_at: form.open_at,
        close_at: form.close_at,
        settings: form.settings,
        theme: { ...form.theme, primary_color: primary, secondary_color: secondary },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms', form.id] })
      onOpenChange(false)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('editor.themeButton')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="theme-primary">{t('editor.themePrimaryLabel')}</Label>
            <input
              id="theme-primary"
              type="color"
              value={primary}
              onChange={(event) => setPrimary(event.target.value)}
              className="h-8 w-14 rounded border"
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="theme-secondary">{t('editor.themeSecondaryLabel')}</Label>
            <input
              id="theme-secondary"
              type="color"
              value={secondary}
              onChange={(event) => setSecondary(event.target.value)}
              className="h-8 w-14 rounded border"
            />
          </div>
          <Button
            className="w-full"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isSuccess ? t('editor.themeSaved') : t('forms.saveButton')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
