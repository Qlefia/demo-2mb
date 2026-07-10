'use client'

import { useTranslation } from 'react-i18next'
import { TextArea } from '@/components/atoms'
import type { TechCluesSection } from '@/lib/dossiers/schema'
import { dossierTagTripleRow } from './dossierSectionLayout'
import { Field } from './Field'
import { TagListEditor } from './TagListEditor'

interface Props {
  value: TechCluesSection | undefined
  onChange: (next: TechCluesSection) => void
  disabled?: boolean
}

export function Section5TechClues({ value, onChange, disabled }: Props) {
  const { t } = useTranslation()
  const current: TechCluesSection = value ?? {}
  const update = (patch: Partial<TechCluesSection>) => onChange({ ...current, ...patch })

  return (
    <div className="space-y-3">
      <div className={dossierTagTripleRow}>
        <Field label={t('dossier.sections.tech_clues.fields.siteStack')}>
          <TagListEditor
            values={current.siteStack ?? []}
            onChange={(next) => update({ siteStack: next.length ? next : undefined })}
            placeholder={t('dossier.sections.tech_clues.fields.siteStackPlaceholder')}
            disabled={disabled}
          />
        </Field>
        <Field label={t('dossier.sections.tech_clues.fields.visibleVendors')}>
          <TagListEditor
            values={current.visibleVendors ?? []}
            onChange={(next) => update({ visibleVendors: next.length ? next : undefined })}
            placeholder={t('dossier.sections.tech_clues.fields.visibleVendorsPlaceholder')}
            disabled={disabled}
          />
        </Field>
        <Field label={t('dossier.sections.tech_clues.fields.careersTooling')}>
          <TagListEditor
            values={current.careersTooling ?? []}
            onChange={(next) => update({ careersTooling: next.length ? next : undefined })}
            placeholder={t('dossier.sections.tech_clues.fields.careersToolingPlaceholder')}
            disabled={disabled}
          />
        </Field>
      </div>
      <Field htmlFor="tech-notes" label={t('dossier.sections.tech_clues.fields.notes')}>
        <TextArea
          id="tech-notes"
          rows={3}
          value={current.notes ?? ''}
          onChange={(e) => update({ notes: e.target.value || undefined })}
          disabled={disabled}
        />
      </Field>
    </div>
  )
}
