'use client'

import { useTranslation } from 'react-i18next'
import { TextArea } from '@/components/atoms'
import type { HooksSection } from '@/lib/dossiers/schema'
import { Field } from './Field'

interface Props {
  value: HooksSection | undefined
  onChange: (next: HooksSection) => void
  disabled?: boolean
}

const HOOK_SLOTS = 3
const HOOK_MIN_LENGTH = 20

export function Section7Hooks({ value, onChange, disabled }: Props) {
  const { t } = useTranslation()
  const items = value?.items ?? []
  const slots = Array.from({ length: HOOK_SLOTS }, (_, i) => items[i] ?? '')

  const handleChange = (idx: number, text: string) => {
    const next = [...slots]
    next[idx] = text
    const allEmpty = next.every((v) => v.trim() === '')
    onChange({ items: allEmpty ? [] : next })
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">{t('dossier.sections.hooks.guidance')}</p>
      {slots.map((hook, idx) => {
        const length = hook.trim().length
        const tooShort = length > 0 && length < HOOK_MIN_LENGTH
        return (
          <Field
            key={idx}
            htmlFor={`hook-${idx}`}
            label={`${t('dossier.sections.hooks.fields.hook')} #${idx + 1}`}
            hint={t('dossier.sections.hooks.fields.minLength', {
              min: HOOK_MIN_LENGTH,
              current: length,
            })}
          >
            <TextArea
              id={`hook-${idx}`}
              rows={2}
              value={hook}
              onChange={(e) => handleChange(idx, e.target.value)}
              error={tooShort ? t('dossier.sections.hooks.fields.tooShort') : undefined}
              disabled={disabled}
            />
          </Field>
        )
      })}
    </div>
  )
}
