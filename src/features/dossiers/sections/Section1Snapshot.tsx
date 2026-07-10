'use client'

import { useTranslation } from 'react-i18next'
import { Input, TextArea } from '@/components/atoms'
import type { SnapshotSection } from '@/lib/dossiers/schema'
import { CrmStackedField } from '@/components/molecules/CrmStackedField'

interface Props {
  value: SnapshotSection | undefined
  onChange: (next: SnapshotSection) => void
  disabled?: boolean
}

export function Section1Snapshot({ value, onChange, disabled }: Props) {
  const { t } = useTranslation()
  const current: SnapshotSection = value ?? {}
  const update = (patch: Partial<SnapshotSection>) => onChange({ ...current, ...patch })

  return (
    <div className="space-y-0 divide-y divide-border/60 rounded-xl bg-foreground/[0.04] px-3 dark:bg-white/[0.05]">
      <CrmStackedField
        label={t('dossier.sections.snapshot.fields.hqCity')}
        htmlFor="snapshot-hqCity"
      >
        <Input
          id="snapshot-hqCity"
          value={current.hqCity ?? ''}
          onChange={(e) => update({ hqCity: e.target.value || undefined })}
          disabled={disabled}
        />
      </CrmStackedField>
      <CrmStackedField
        label={t('dossier.sections.snapshot.fields.hqCountry')}
        htmlFor="snapshot-hqCountry"
      >
        <Input
          id="snapshot-hqCountry"
          value={current.hqCountry ?? ''}
          onChange={(e) => update({ hqCountry: e.target.value || undefined })}
          disabled={disabled}
        />
      </CrmStackedField>
      <CrmStackedField
        label={t('prospects.company.projectPhase')}
        htmlFor="snapshot-projectPhase"
      >
        <Input
          id="snapshot-projectPhase"
          value={current.projectPhase ?? ''}
          onChange={(e) => update({ projectPhase: e.target.value || undefined })}
          disabled={disabled}
          placeholder={t('prospects.company.projectPhasePlaceholder')}
        />
      </CrmStackedField>
      <CrmStackedField
        label={t('prospects.company.architectAgency')}
        htmlFor="snapshot-architectAgency"
      >
        <Input
          id="snapshot-architectAgency"
          value={current.architectAgency ?? ''}
          onChange={(e) => update({ architectAgency: e.target.value || undefined })}
          disabled={disabled}
          placeholder={t('prospects.company.architectAgencyPlaceholder')}
        />
      </CrmStackedField>
      <CrmStackedField
        label={t('prospects.company.visualObservation')}
        htmlFor="snapshot-notes"
      >
        <TextArea
          id="snapshot-notes"
          rows={3}
          value={current.notes ?? ''}
          onChange={(e) => update({ notes: e.target.value || undefined })}
          disabled={disabled}
          placeholder={t('prospects.company.visualObservationPlaceholder')}
        />
      </CrmStackedField>
    </div>
  )
}
