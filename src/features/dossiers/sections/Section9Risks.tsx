'use client'

import { useTranslation } from 'react-i18next'
import { TextArea } from '@/components/atoms'
import type { RisksSection } from '@/lib/dossiers/schema'
import { Field } from './Field'
import { TagListEditor } from './TagListEditor'

interface Props {
  value: RisksSection | undefined
  onChange: (next: RisksSection) => void
  disabled?: boolean
}

export function Section9Risks({ value, onChange, disabled }: Props) {
  const { t } = useTranslation()
  const current: RisksSection = value ?? {}
  const update = (patch: Partial<RisksSection>) => onChange({ ...current, ...patch })

  return (
    <div className="space-y-3">
      <Field htmlFor="risks-summary" label={t('dossier.sections.risks.fields.summary')}>
        <TextArea
          id="risks-summary"
          rows={3}
          value={current.summary ?? ''}
          onChange={(e) => update({ summary: e.target.value || undefined })}
          disabled={disabled}
        />
      </Field>
      <Field
        label={t('dossier.sections.risks.fields.blockers')}
        hint={t('dossier.sections.risks.fields.blockersHint')}
      >
        <TagListEditor
          values={current.blockers ?? []}
          onChange={(next) => update({ blockers: next.length ? next : undefined })}
          placeholder={t('dossier.sections.risks.fields.blockersPlaceholder')}
          disabled={disabled}
        />
      </Field>
    </div>
  )
}
