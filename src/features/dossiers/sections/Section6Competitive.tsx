'use client'

import { useTranslation } from 'react-i18next'
import { TextArea } from '@/components/atoms'
import type { CompetitiveSection } from '@/lib/dossiers/schema'
import { Field } from './Field'
import { TagListEditor } from './TagListEditor'

interface Props {
  value: CompetitiveSection | undefined
  onChange: (next: CompetitiveSection) => void
  disabled?: boolean
}

export function Section6Competitive({ value, onChange, disabled }: Props) {
  const { t } = useTranslation()
  const current: CompetitiveSection = value ?? {}
  const update = (patch: Partial<CompetitiveSection>) => onChange({ ...current, ...patch })

  return (
    <div className="space-y-3">
      <Field label={t('dossier.sections.competitive.fields.currentVendors')}>
        <TagListEditor
          values={current.currentVendors ?? []}
          onChange={(next) => update({ currentVendors: next.length ? next : undefined })}
          placeholder={t('dossier.sections.competitive.fields.currentVendorsPlaceholder')}
          disabled={disabled}
        />
      </Field>
      <Field
        htmlFor="competitive-inhouse"
        label={t('dossier.sections.competitive.fields.inHouseTeam')}
      >
        <TextArea
          id="competitive-inhouse"
          rows={2}
          value={current.inHouseTeam ?? ''}
          onChange={(e) => update({ inHouseTeam: e.target.value || undefined })}
          disabled={disabled}
        />
      </Field>
      <Field htmlFor="competitive-notes" label={t('dossier.sections.competitive.fields.notes')}>
        <TextArea
          id="competitive-notes"
          rows={3}
          value={current.notes ?? ''}
          onChange={(e) => update({ notes: e.target.value || undefined })}
          disabled={disabled}
        />
      </Field>
    </div>
  )
}
