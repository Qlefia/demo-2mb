'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { Button, Input, TextArea } from '@/components/atoms'
import { Modal } from '@/components/molecules/Modal'
import { toast } from '@/components/molecules/Toast'
import { prospectDetailQueryKey, prospectHeaderQueryKey } from '@/features/prospects/api/prospectDetailQueryKeys'

interface ProspectAddTriggerDialogProps {
  prospectId: string
  open: boolean
  onClose: () => void
  onCreated?: () => void
}

export function ProspectAddTriggerDialog({
  prospectId,
  open,
  onClose,
  onCreated,
}: ProspectAddTriggerDialogProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [text, setText] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    const trimmed = text.trim()
    if (trimmed.length === 0) return
    setBusy(true)
    try {
      const res = await fetch('/api/triggers', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospectId,
          text: trimmed,
          sourceUrl: sourceUrl.trim() || undefined,
        }),
      })
      if (!res.ok) {
        toast(t('error.somethingWentWrong'), 'error')
        return
      }
      setText('')
      setSourceUrl('')
      onClose()
      onCreated?.()
      void queryClient.invalidateQueries({ queryKey: prospectDetailQueryKey(prospectId) })
      void queryClient.invalidateQueries({ queryKey: prospectHeaderQueryKey(prospectId) })
      toast(t('opsToday.addTriggerModal.success'), 'success')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('opsToday.addTriggerModal.title')}
      preventBackdropDismiss
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
            {t('common.cancel')}
          </Button>
          <Button type="button" onClick={() => void submit()} disabled={busy || text.trim().length === 0}>
            {busy ? t('common.saving') : t('common.submit')}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <label className="block text-sm">
          <span className="crm-meta-label">{t('opsToday.addTriggerModal.textLabel')}</span>
          <TextArea
            className="mt-1 min-h-[100px]"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="crm-meta-label">{t('opsToday.addTriggerModal.sourceUrlLabel')}</span>
          <Input
            className="mt-1"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://"
          />
        </label>
      </div>
    </Modal>
  )
}
