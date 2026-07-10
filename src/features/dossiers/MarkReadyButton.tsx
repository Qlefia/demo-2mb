'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, RotateCcw, X } from 'lucide-react'
import { Button } from '@/components/atoms'
import { toast } from '@/components/molecules/Toast'
import type { DossierStatus } from '@/lib/db/schema/enums'
import type { QualityFailure } from '@/lib/dossiers/validate'

interface MarkReadyButtonProps {
  prospectId: string
  status: DossierStatus | null
  canMarkInReview: boolean
  qualityPassed: boolean
  qualityPending: boolean
  hasUnsavedChanges: boolean
  onChanged: () => void
}

interface ServerFailure {
  failures?: QualityFailure[]
  error?: string
  reason?: string
}

export function MarkReadyButton({
  prospectId,
  status,
  canMarkInReview,
  qualityPassed,
  qualityPending,
  hasUnsavedChanges,
  onChanged,
}: MarkReadyButtonProps) {
  const { t } = useTranslation()
  const [submitting, setSubmitting] = useState(false)
  const [confirmReopen, setConfirmReopen] = useState(false)

  const handleMarkReady = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/prospects/${prospectId}/dossier/mark-ready`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as ServerFailure
        if (res.status === 422 && payload.failures && payload.failures.length > 0) {
          const first = payload.failures[0]
          toast(t(first.messageKey), 'error')
        } else {
          toast(t(`dossier.errors.${payload.error ?? 'mark_ready_failed'}`), 'error')
        }
        return
      }
      toast(t('dossier.toasts.markedReady'), 'success')
      onChanged()
    } finally {
      setSubmitting(false)
    }
  }

  const handleReopen = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/prospects/${prospectId}/dossier/mark-in-review`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as ServerFailure
        toast(t(`dossier.errors.${payload.error ?? 'mark_in_review_failed'}`), 'error')
        return
      }
      toast(t('dossier.toasts.reopened'), 'success')
      setConfirmReopen(false)
      onChanged()
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'ready') {
    if (!canMarkInReview) return null
    if (confirmReopen) {
      return (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted">{t('dossier.actions.reopenConfirm')}</span>
          <Button variant="destructive" size="sm" className="w-8 px-0" onClick={handleReopen} loading={submitting} title={t('dossier.actions.reopen')}>
            {!submitting && <RotateCcw size={16} />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-8 px-0"
            onClick={() => setConfirmReopen(false)}
            disabled={submitting}
            title={t('common.cancel')}
          >
            <X size={16} />
          </Button>
        </div>
      )
    }
    return (
      <Button variant="secondary" size="sm" className="w-8 px-0" onClick={() => setConfirmReopen(true)} title={t('dossier.actions.reopen')}>
        <RotateCcw size={16} />
      </Button>
    )
  }

  const disabled = submitting || !qualityPassed || qualityPending || hasUnsavedChanges
  const blockReason = hasUnsavedChanges
    ? 'unsavedChanges'
    : !qualityPassed
      ? 'qualityFailed'
      : qualityPending
        ? 'qualityPending'
        : null

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="primary"
        size="sm"
        className="w-8 px-0"
        onClick={handleMarkReady}
        disabled={disabled}
        loading={submitting}
        title={blockReason ? t(`dossier.actions.markReadyHint.${blockReason}`) : t('dossier.actions.markReady')}
      >
        {!submitting && <CheckCircle2 size={16} />}
      </Button>
    </div>
  )
}
