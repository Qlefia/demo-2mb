'use client'

import { useTranslation } from 'react-i18next'
import { Input, TextArea } from '@/components/atoms'
import type { WhatTheyDoSection } from '@/lib/dossiers/schema'
import { CrmStackedField } from '@/components/molecules/CrmStackedField'
import { TagListEditor } from './TagListEditor'

interface Props {
  value: WhatTheyDoSection | undefined
  onChange: (next: WhatTheyDoSection) => void
  disabled?: boolean
}

export function Section2WhatTheyDo({ value, onChange, disabled }: Props) {
  const { t } = useTranslation()
  const current: WhatTheyDoSection = value ?? {}
  const update = (patch: Partial<WhatTheyDoSection>) => onChange({ ...current, ...patch })

  return (
    <div className="space-y-0 divide-y divide-border/60 rounded-xl bg-foreground/[0.04] px-3 dark:bg-white/[0.05]">
      <CrmStackedField label={t('dossier.sections.what_they_do.fields.summary')} htmlFor="wtd-summary">
        <TextArea
          id="wtd-summary"
          rows={3}
          value={current.summary ?? ''}
          onChange={(e) => update({ summary: e.target.value || undefined })}
          disabled={disabled}
        />
      </CrmStackedField>
      <CrmStackedField label={t('prospects.company.segments')}>
        <TagListEditor
          values={current.segments ?? []}
          onChange={(next) => update({ segments: next.length ? next : undefined })}
          placeholder={t('dossier.sections.what_they_do.fields.segmentsPlaceholder')}
          disabled={disabled}
        />
        <p className="mt-1 text-[11px] text-muted">
          {t('dossier.sections.what_they_do.fields.segmentsHint')}
        </p>
      </CrmStackedField>
      <CrmStackedField
        label={t('prospects.company.flagshipProgramme')}
        htmlFor="wtd-flagship"
      >
        <Input
          id="wtd-flagship"
          value={current.flagshipOffering ?? ''}
          onChange={(e) => update({ flagshipOffering: e.target.value || undefined })}
          disabled={disabled}
        />
      </CrmStackedField>
      <CrmStackedField
        label={t('prospects.company.targetCustomer')}
        htmlFor="wtd-target"
      >
        <Input
          id="wtd-target"
          value={current.targetCustomer ?? ''}
          onChange={(e) => update({ targetCustomer: e.target.value || undefined })}
          disabled={disabled}
        />
      </CrmStackedField>
    </div>
  )
}
