'use client'

import { useTranslation } from 'react-i18next'
import { TextArea } from '@/components/atoms'
import type { NextStepSection } from '@/lib/dossiers/schema'
import { Field } from './Field'

interface Props {
  value: NextStepSection | undefined
  onChange: (next: NextStepSection) => void
  disabled?: boolean
}

const CHANNELS: NonNullable<NextStepSection['channel']>[] = [
  'call',
  'email',
  'linkedin',
  'warm_intro',
]

export function Section10NextStep({ value, onChange, disabled }: Props) {
  const { t } = useTranslation()
  const current: NextStepSection = value ?? {}
  const update = (patch: Partial<NextStepSection>) => onChange({ ...current, ...patch })

  return (
    <div className="space-y-3">
      <Field htmlFor="next-channel" label={t('dossier.sections.next_step.fields.channel')}>
        <select
          id="next-channel"
          value={current.channel ?? ''}
          onChange={(e) => update({ channel: (e.target.value || undefined) as NextStepSection['channel'] })}
          disabled={disabled}
          className="survey-brand-input h-10 w-full border border-input bg-transparent px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">{t('common.unset')}</option>
          {CHANNELS.map((c) => (
            <option key={c} value={c}>
              {t(`dossier.sections.next_step.channels.${c}`)}
            </option>
          ))}
        </select>
      </Field>
      <Field htmlFor="next-notes" label={t('dossier.sections.next_step.fields.notes')}>
        <TextArea
          id="next-notes"
          rows={3}
          value={current.notes ?? ''}
          onChange={(e) => update({ notes: e.target.value || undefined })}
          disabled={disabled}
        />
      </Field>
    </div>
  )
}
