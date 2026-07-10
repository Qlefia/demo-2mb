'use client'

import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { Input, TextArea } from '@/components/atoms'
import { studioRadiusNested } from '@/features/studio-settings/studioBlockChrome'
import type { CasesSection } from '@/lib/dossiers/schema'
import { Field } from './Field'

interface Props {
  value: CasesSection | undefined
  onChange: (next: CasesSection) => void
  disabled?: boolean
}

const SLOTS = 3

export function Section8Cases({ value, onChange, disabled }: Props) {
  const { t } = useTranslation()
  const items = value?.items ?? []
  const slots = Array.from({ length: SLOTS }, (_, i) => items[i] ?? {})

  const update = (idx: number, patch: Partial<CasesSection['items'][number]>) => {
    const next = slots.map((item, i) => (i === idx ? { ...item, ...patch } : item))
    onChange({ items: next as CasesSection['items'] })
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">{t('dossier.sections.cases.guidance')}</p>
      {slots.map((slot, idx) => (
        <div key={idx} className={cn('space-y-2 bg-background p-3', studioRadiusNested)}>
          <Field htmlFor={`case-name-${idx}`} label={`${t('dossier.sections.cases.fields.name')} #${idx + 1}`}>
            <Input
              id={`case-name-${idx}`}
              value={slot.name ?? ''}
              onChange={(e) => update(idx, { name: e.target.value })}
              disabled={disabled}
            />
          </Field>
          <Field htmlFor={`case-why-${idx}`} label={t('dossier.sections.cases.fields.why')}>
            <TextArea
              id={`case-why-${idx}`}
              rows={2}
              value={slot.why ?? ''}
              onChange={(e) => update(idx, { why: e.target.value })}
              disabled={disabled}
            />
          </Field>
        </div>
      ))}
    </div>
  )
}
