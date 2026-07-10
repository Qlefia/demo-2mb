'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button, IconButton, Input, Label } from '@/components/atoms'
import { Select } from '@/components/molecules/Select'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'
import { studioRadiusBlock, studioTintPanel } from '@/features/studio-settings/studioBlockChrome'
import { DEAL_STAGES, type DealStage } from '@/lib/db/schema/enums'

export interface DealDto {
  id: string
  prospectId: string
  title: string
  value: string | null
  currency: string
  stage: DealStage
  createdAt: string
  updatedAt: string
}

function formatMoney(amount: string | null, currency: string, locale: string) {
  if (amount == null) return '—'
  const n = Number.parseFloat(amount)
  if (!Number.isFinite(n)) return amount
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(n)
  } catch {
    return `${amount} ${currency}`
  }
}

export function DealsPanel({ prospectId }: { prospectId: string }) {
  const { t, i18n } = useTranslation()
  const [items, setItems] = useState<DealDto[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [value, setValue] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch(`/api/prospects/${prospectId}/deals`, { credentials: 'include' })
    if (!res.ok) {
      setItems([])
      return
    }
    const data = (await res.json()) as { items?: DealDto[] }
    setItems(data.items ?? [])
  }, [prospectId])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void load().finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [load])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    try {
      const raw = value.trim().replace(',', '.')
      const num = raw === '' ? undefined : Number.parseFloat(raw)
      const res = await fetch(`/api/prospects/${prospectId}/deals`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          currency,
          value: Number.isFinite(num) ? num : undefined,
        }),
      })
      if (!res.ok) return
      setTitle('')
      setValue('')
      await load()
    } finally {
      setSubmitting(false)
    }
  }

  async function patchStage(id: string, stage: DealStage) {
    const res = await fetch(`/api/prospects/${prospectId}/deals/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage }),
    })
    if (res.ok) await load()
  }

  async function confirmRemove() {
    if (!pendingDelete) return
    setDeleteBusy(true)
    try {
      const res = await fetch(`/api/prospects/${prospectId}/deals/${pendingDelete}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) await load()
    } finally {
      setDeleteBusy(false)
      setPendingDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="sr-only">{t('deals.title')}</h2>

      <form onSubmit={(e) => void handleAdd(e)} className={studioTintPanel}>
        <p className="mb-3 text-[10px] font-medium uppercase tracking-wider text-muted">
          {t('deals.add')}
        </p>
        <div className="grid gap-3">
          <div>
            <Label htmlFor={`deal-title-${prospectId}`}>{t('deals.opportunityLabel')}</Label>
            <Input
              id={`deal-title-${prospectId}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('deals.namePlaceholder')}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor={`deal-value-${prospectId}`}>{t('deals.valueLabel')}</Label>
              <Input
                id={`deal-value-${prospectId}`}
                inputMode="decimal"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor={`deal-currency-${prospectId}`}>{t('deals.currency')}</Label>
              <Input
                id={`deal-currency-${prospectId}`}
                maxLength={3}
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                placeholder="EUR"
              />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full"
            loading={submitting}
            disabled={submitting || !title.trim()}
          >
            {t('deals.add')}
          </Button>
        </div>
      </form>

      {loading ? (
        <p className="text-sm text-muted">{t('common.loading')}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted">{t('deals.empty')}</p>
      ) : (
        <ul className="grid gap-2">
          {items.map((d) => (
            <li
              key={d.id}
              className={cn(
                studioRadiusBlock,
                'flex flex-wrap items-center gap-3 bg-foreground/4 px-3 py-3 text-sm md:flex-nowrap dark:bg-white/5',
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{d.title}</p>
                <p className="text-xs text-muted">
                  {formatMoney(d.value, d.currency, i18n.language)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32">
                  <Select
                    value={d.stage}
                    onChange={(v) => void patchStage(d.id, v as DealStage)}
                    options={DEAL_STAGES.map((s) => ({ value: s, label: t(`deals.stages.${s}`) }))}
                  />
                </div>
                <IconButton
                  icon={Trash2}
                  label={t('deals.delete')}
                  variant="ghost"
                  className="text-muted hover:text-destructive"
                  onClick={() => setPendingDelete(d.id)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => void confirmRemove()}
        title={t('deals.delete')}
        message={t('deals.deleteConfirm')}
        variant="destructive"
        loading={deleteBusy}
      />
    </div>
  )
}
