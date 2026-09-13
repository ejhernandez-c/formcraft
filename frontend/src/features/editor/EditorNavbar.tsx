import { Eye, MoreVertical, Palette, Share2 } from 'lucide-react'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'

import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/AuthContext'
import { PublishDialog } from '@/features/editor/PublishDialog'
import { ShareLinkDialog } from '@/features/editor/ShareLinkDialog'
import { ThemeDialog } from '@/features/editor/ThemeDialog'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { t } from '@/i18n'
import type { FormDetail } from '@/services/forms'
import { archiveForm, closeForm, duplicateForm, publishForm, updateForm } from '@/services/forms'

interface EditorNavbarProps {
  form: FormDetail
  onOpenPreview: () => void
}

export function EditorNavbar({ form, onOpenPreview }: EditorNavbarProps) {
  const { token, user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState(form.name)
  const [themeOpen, setThemeOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)

  const invalidate = (): void => {
    queryClient.invalidateQueries({ queryKey: ['forms', form.id] })
    queryClient.invalidateQueries({ queryKey: ['forms'] })
  }

  const { debounced: debouncedSaveTitle } = useDebouncedCallback((value: string) => {
    if (!value.trim()) return
    updateForm(token as string, form.id, {
      name: value,
      description: form.description,
      identification_type: form.identification_type,
      allow_multiple_responses: form.allow_multiple_responses,
      response_limit_enabled: form.response_limit_enabled,
      max_responses: form.max_responses,
      one_response_per_email: form.one_response_per_email,
      open_at: form.open_at,
      close_at: form.close_at,
      settings: form.settings,
      theme: form.theme,
    }).then(invalidate)
  }, 600)

  const publishMutation = useMutation({
    mutationFn: () => publishForm(token as string, form.id),
    onSuccess: () => {
      invalidate()
      setPublishOpen(false)
    },
  })
  const closeMutation = useMutation({
    mutationFn: () => closeForm(token as string, form.id),
    onSuccess: invalidate,
  })
  const archiveMutation = useMutation({
    mutationFn: () => archiveForm(token as string, form.id),
    onSuccess: invalidate,
  })
  const duplicateMutation = useMutation({
    mutationFn: () => duplicateForm(token as string, form.id),
    onSuccess: (copy) => {
      queryClient.invalidateQueries({ queryKey: ['forms'] })
      navigate(`/forms/${copy.id}`)
    },
  })

  const isMutating =
    closeMutation.isPending || archiveMutation.isPending || duplicateMutation.isPending

  return (
    <header className="border-b bg-background">
      <div className="flex items-center gap-4 px-4 py-2">
        <Link
          to="/"
          className="shrink-0 text-lg font-medium"
          aria-label={t('editor.backToDashboard')}
        >
          {t('app.title')}
        </Link>

        <Input
          value={title}
          onChange={(event) => {
            setTitle(event.target.value)
            debouncedSaveTitle(event.target.value)
          }}
          placeholder={t('editor.formTitlePlaceholder')}
          aria-label={t('editor.formTitlePlaceholder')}
          className="max-w-sm border-transparent bg-transparent text-lg font-medium shadow-none focus-visible:border-input"
        />

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t('editor.themeButton')}
            onClick={() => setThemeOpen(true)}
          >
            <Palette aria-hidden="true" className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t('builder.previewButton')}
            onClick={onOpenPreview}
          >
            <Eye aria-hidden="true" className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t('editor.shareButton')}
            onClick={() => setShareOpen(true)}
          >
            <Share2 aria-hidden="true" className="size-4" />
          </Button>

          {form.status === 'draft' && (
            <Button type="button" size="sm" onClick={() => setPublishOpen(true)}>
              {t('dashboard.actionPublish')}
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" aria-label={t('editor.menuOpen')} />}
            >
              <MoreVertical aria-hidden="true" className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled={isMutating} onClick={() => duplicateMutation.mutate()}>
                {t('dashboard.actionDuplicate')}
              </DropdownMenuItem>
              {form.status === 'published' && (
                <DropdownMenuItem disabled={isMutating} onClick={() => closeMutation.mutate()}>
                  {t('dashboard.actionClose')}
                </DropdownMenuItem>
              )}
              {form.status !== 'archived' && (
                <DropdownMenuItem disabled={isMutating} onClick={() => archiveMutation.mutate()}>
                  {t('dashboard.actionArchive')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {user && (
            <Avatar seed={user.id} label={user.name} ariaLabel={t('dashboard.userMenuLabel')} />
          )}
        </div>
      </div>

      <ThemeDialog form={form} open={themeOpen} onOpenChange={setThemeOpen} />
      <ShareLinkDialog slug={form.slug} open={shareOpen} onOpenChange={setShareOpen} />
      <PublishDialog
        form={form}
        open={publishOpen}
        onOpenChange={setPublishOpen}
        onConfirm={() => publishMutation.mutate()}
        isPending={publishMutation.isPending}
      />
    </header>
  )
}
