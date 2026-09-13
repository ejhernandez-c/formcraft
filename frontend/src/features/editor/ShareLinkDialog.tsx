import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { t } from '@/i18n'

interface ShareLinkDialogProps {
  slug: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShareLinkDialog({ slug, open, onOpenChange }: ShareLinkDialogProps) {
  const [copied, setCopied] = useState(false)
  const publicUrl = `${window.location.origin}/f/${slug}`

  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
    } catch {
      // Clipboard permission denied or unavailable — the URL is still
      // selectable text in the input, so the user can copy it manually.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('editor.shareButton')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="share-link">{t('editor.shareLinkLabel')}</Label>
            <div className="flex gap-2">
              <Input
                id="share-link"
                readOnly
                value={publicUrl}
                onFocus={(e) => e.target.select()}
              />
              <Button type="button" variant="outline" onClick={handleCopy}>
                {copied ? t('editor.shareCopied') : t('editor.shareCopyButton')}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t('editor.sharePublicNotLive')}</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
