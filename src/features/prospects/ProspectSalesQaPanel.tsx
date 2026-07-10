'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TextArea } from '@/components/atoms'
import { toast } from '@/components/molecules/Toast'
import {
  studioGhostActionBlock,
  studioTintPanel,
} from '@/features/studio-settings/studioBlockChrome'
import { cn } from '@/lib/cn'
import { prospectSideRailPanelBody } from '@/features/prospects/prospectSideRailChrome'

type QaRow = {
  id: string
  question: string
  answer: string | null
  createdAt: string
}

export function ProspectSalesQaPanel({ prospectId }: { prospectId: string }) {
  const { t } = useTranslation()
  const [items, setItems] = useState<QaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    void fetch(`/api/prospects/${prospectId}/sales-qa`, { credentials: 'include', cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data: { items?: QaRow[] }) => setItems(data.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [prospectId])

  useEffect(() => {
    load()
  }, [load])

  async function submit() {
    const q = question.trim()
    if (!q) {
      toast(t('prospects.workspace.qaQuestionEmpty'), 'error')
      return
    }
    setBusy(true)
    try {
      const res = await fetch(`/api/prospects/${prospectId}/sales-qa`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          answer: answer.trim() || undefined,
        }),
      })
      if (!res.ok) {
        toast(t('error.somethingWentWrong'), 'error')
        return
      }
      setQuestion('')
      setAnswer('')
      toast(t('prospects.workspace.qaSaved'), 'success')
      load()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={prospectSideRailPanelBody}>
      <p className="w-full text-xs text-muted">{t('prospects.workspace.qaHint')}</p>
      <TextArea
        rows={3}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder={t('prospects.workspace.qaQuestionPlaceholder')}
        className="w-full text-sm"
      />
      <TextArea
        rows={3}
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder={t('prospects.workspace.qaAnswerPlaceholder')}
        className="w-full text-sm"
      />
      <button type="button" disabled={busy} onClick={() => void submit()} className={studioGhostActionBlock}>
        {busy ? t('common.loading') : t('prospects.workspace.qaSave')}
      </button>

      <div className="w-full border-t border-border/60 pt-3">
        <p className="crm-meta-label w-full">{t('prospects.workspace.qaHistory')}</p>
        {loading ? (
          <p className="mt-2 w-full text-xs text-muted">{t('common.loading')}</p>
        ) : items.length === 0 ? (
          <p className="mt-2 w-full text-xs text-muted">{t('prospects.workspace.qaEmpty')}</p>
        ) : (
          <ul className="mt-2 grid max-h-[45vh] w-full gap-2 overflow-y-auto">
            {items.map((it) => (
              <li key={it.id} className={cn(studioTintPanel, 'w-full')}>
                <p className="w-full text-xs font-medium text-foreground">{it.question}</p>
                {it.answer ? <p className="mt-1 w-full text-xs text-muted">{it.answer}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
