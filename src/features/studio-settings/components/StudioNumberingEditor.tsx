'use client'

import { useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Input, Label, Switch } from '@/components/atoms'
import { Select } from '@/components/molecules/Select'
import { STUDIO_NUMBERING_LIMITS } from '@/features/studio-settings/constants'
import { formatDocumentNumber } from '@/lib/studio/defaultNumbering'
import {
  STUDIO_YEAR_RESET_POLICIES,
  type StudioDocumentNumbering,
  type StudioYearResetPolicy,
} from '@/stores/studioProfileTypes'
import type { GeneralForm } from '@/features/studio-settings/sections/studioGeneralForm'

type StudioNumberingEditorProps = {
  field: 'offerNumbering' | 'invoiceNumbering'
}

export function StudioNumberingEditor({ field }: StudioNumberingEditorProps) {
  const { t } = useTranslation()
  const { control, setValue, register } = useFormContext<GeneralForm>()
  const config = useWatch({ control, name: field }) as GeneralForm[typeof field]

  const yearPolicyOptions = STUDIO_YEAR_RESET_POLICIES.map((policy) => ({
    value: policy,
    label: t(`studioSettings.invoicing.yearResetPolicy.${policy}`),
  }))

  if (!config) return null

  const previewYear = new Date().getFullYear()
  const sample = formatDocumentNumber(config as StudioDocumentNumbering, previewYear)

  function patchNumber(name: 'padWidth' | 'nextNumber', raw: string) {
    const trimmed = raw.trim()
    if (trimmed === '') return
    const parsed = Number.parseInt(trimmed, 10)
    if (!Number.isFinite(parsed)) return
    setValue(`${field}.${name}`, parsed, { shouldDirty: true, shouldTouch: true })
  }

  function setIncludeYear(checked: boolean) {
    setValue(`${field}.includeYear`, checked, { shouldDirty: true, shouldTouch: true })
  }

  function setYearPolicy(next: string) {
    setValue(`${field}.yearResetPolicy`, next as StudioYearResetPolicy, {
      shouldDirty: true,
      shouldTouch: true,
    })
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-[1fr_72px_1fr_1fr]">
        <div className="studio-field-stack">
          <Label>{t('studioSettings.invoicing.numberingPrefix')}</Label>
          <Input
            placeholder="INV"
            maxLength={STUDIO_NUMBERING_LIMITS.prefix}
            autoComplete="off"
            {...register(`${field}.prefix`)}
          />
        </div>
        <div className="studio-field-stack">
          <Label>{t('studioSettings.invoicing.numberingSeparator')}</Label>
          <Input
            placeholder="-"
            maxLength={STUDIO_NUMBERING_LIMITS.separator}
            autoComplete="off"
            {...register(`${field}.separator`)}
          />
        </div>
        <div className="studio-field-stack">
          <Label>{t('studioSettings.invoicing.numberingPadWidth')}</Label>
          <Input
            type="number"
            inputMode="numeric"
            min={STUDIO_NUMBERING_LIMITS.padWidthMin}
            max={STUDIO_NUMBERING_LIMITS.padWidthMax}
            value={String(config.padWidth)}
            onChange={(e) => patchNumber('padWidth', e.target.value)}
          />
        </div>
        <div className="studio-field-stack">
          <Label>{t('studioSettings.invoicing.numberingNextNumber')}</Label>
          <Input
            type="number"
            inputMode="numeric"
            min={STUDIO_NUMBERING_LIMITS.nextNumberMin}
            max={STUDIO_NUMBERING_LIMITS.nextNumberMax}
            value={String(config.nextNumber)}
            onChange={(e) => patchNumber('nextNumber', e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Switch
          checked={config.includeYear}
          onChange={setIncludeYear}
          label={t('studioSettings.invoicing.numberingIncludeYear')}
        />
        <div className="min-w-48 flex-1">
          <Select
            value={config.yearResetPolicy}
            onChange={setYearPolicy}
            options={yearPolicyOptions}
            placeholder={t('studioSettings.invoicing.numberingYearResetPolicy')}
            disabled={!config.includeYear}
          />
        </div>
      </div>

      <p className="text-xs text-muted">
        {t('studioSettings.invoicing.numberingPreview')}{' '}
        <span className="font-mono text-foreground">{sample}</span>
      </p>
    </div>
  )
}
