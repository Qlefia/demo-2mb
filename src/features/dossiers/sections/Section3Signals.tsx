'use client'

import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button, Input, TextArea } from '@/components/atoms'
import { studioRadiusNested } from '@/features/studio-settings/studioBlockChrome'
import type { SignalsSection } from '@/lib/dossiers/schema'
import { Field } from './Field'
import { dossierInlineTriple } from './dossierSectionLayout'

interface Props {
  value: SignalsSection | undefined
  onChange: (next: SignalsSection) => void
  disabled?: boolean
}

const MAX_ITEMS = 10

function toDateInputValue(isoOrDate: string | undefined): string {
  if (!isoOrDate?.trim()) return ''
  const s = isoOrDate.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  if (s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  return ''
}

export function Section3Signals({ value, onChange, disabled }: Props) {
  const { t } = useTranslation()
  const items = value?.items ?? []

  const update = (next: SignalsSection['items']) => onChange({ items: next })

  const handleAdd = () => {
    if (items.length >= MAX_ITEMS) return
    update([
      ...items,
      {
        text: '',
        sourceUrl: undefined,
        occurredAt: new Date().toISOString().slice(0, 10),
        type: undefined,
      },
    ])
  }

  const handleRemove = (idx: number) => update(items.filter((_, i) => i !== idx))

  const handleChange = (idx: number, patch: Partial<SignalsSection['items'][number]>) => {
    const next = items.map((item, i) => (i === idx ? { ...item, ...patch } : item))
    update(next)
  }

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className={cn(studioRadiusNested, 'bg-background p-3 text-xs text-muted')}>
          {t('dossier.sections.signals.empty')}
        </p>
      )}
      {items.map((item, idx) => (
        <div key={idx} className={cn('space-y-2 bg-background p-3', studioRadiusNested)}>
          <Field
            htmlFor={`signal-text-${idx}`}
            label={`${t('dossier.sections.signals.fields.text')} #${idx + 1}`}
          >
            <TextArea
              id={`signal-text-${idx}`}
              rows={2}
              value={item.text}
              onChange={(e) => handleChange(idx, { text: e.target.value })}
              disabled={disabled}
            />
          </Field>
          <div className={dossierInlineTriple}>
            <Field htmlFor={`signal-source-${idx}`} label={t('dossier.sections.signals.fields.sourceUrl')}>
              <Input
                id={`signal-source-${idx}`}
                value={item.sourceUrl ?? ''}
                onChange={(e) => handleChange(idx, { sourceUrl: e.target.value || undefined })}
                placeholder={t('dossier.sections.signals.fields.urlPlaceholder')}
                disabled={disabled}
              />
            </Field>
            <Field htmlFor={`signal-date-${idx}`} label={t('dossier.sections.signals.fields.occurredAt')}>
              <Input
                id={`signal-date-${idx}`}
                type="date"
                value={toDateInputValue(item.occurredAt)}
                onChange={(e) => handleChange(idx, { occurredAt: e.target.value || undefined })}
                disabled={disabled}
              />
            </Field>
            <Field htmlFor={`signal-type-${idx}`} label={t('dossier.sections.signals.fields.type')}>
              <Input
                id={`signal-type-${idx}`}
                value={item.type ?? ''}
                onChange={(e) => handleChange(idx, { type: e.target.value || undefined })}
                placeholder={t('dossier.sections.signals.fields.typePlaceholder')}
                disabled={disabled}
              />
            </Field>
          </div>
          {!disabled && (
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => handleRemove(idx)}>
                <Trash2 size={14} />
                {t('common.remove')}
              </Button>
            </div>
          )}
        </div>
      ))}
      {!disabled && items.length < MAX_ITEMS && (
        <Button variant="secondary" size="sm" onClick={handleAdd}>
          <Plus size={14} />
          {t('dossier.sections.signals.add')}
        </Button>
      )}
    </div>
  )
}
