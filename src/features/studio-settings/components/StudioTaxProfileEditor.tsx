'use client'

import { useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Input, Label, Switch, TextArea } from '@/components/atoms'
import { RadioGroup } from '@/components/molecules/RadioGroup'
import { Select } from '@/components/molecules/Select'
import {
  STUDIO_TAX_PROFILE_LIMITS,
} from '@/features/studio-settings/constants'
import {
  STUDIO_TAX_MODES,
  type StudioTaxMode,
} from '@/stores/studioProfileTypes'
import type { GeneralForm } from '@/features/studio-settings/sections/studioGeneralForm'

const FIELD = 'taxProfile' as const

export function StudioTaxProfileEditor() {
  const { t } = useTranslation()
  const { control, setValue, register, formState: { errors } } = useFormContext<GeneralForm>()
  const taxProfile = useWatch({ control, name: FIELD }) as GeneralForm['taxProfile']

  const modeOptions = STUDIO_TAX_MODES.map((mode) => ({
    value: mode,
    label: t(`studioSettings.invoicing.taxMode.${mode}`),
  }))

  const rateOptions = (taxProfile?.vatRateOptions ?? []).map((rate) => ({
    value: String(rate),
    label: `${rate} %`,
  }))

  function setMode(next: StudioTaxMode) {
    setValue(`${FIELD}.mode`, next, { shouldDirty: true, shouldTouch: true })
  }

  function setDefaultRate(next: string) {
    const parsed = Number.parseInt(next, 10)
    if (!Number.isFinite(parsed)) return
    setValue(`${FIELD}.defaultVatRatePercent`, parsed, { shouldDirty: true, shouldTouch: true })
  }

  function toggleFooterNote(checked: boolean) {
    setValue(`${FIELD}.showTaxModeFooterNote`, checked, { shouldDirty: true, shouldTouch: true })
  }

  if (!taxProfile) return null

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t('studioSettings.invoicing.taxModeLabel')}</Label>
        <RadioGroup value={taxProfile.mode} onChange={(v) => setMode(v as StudioTaxMode)} options={modeOptions} />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="studio-field-stack">
          <Label htmlFor="studio-tax-steuernummer">{t('studioSettings.invoicing.steuernummer')}</Label>
          <Input
            id="studio-tax-steuernummer"
            placeholder={t('studioSettings.invoicing.steuernummerPlaceholder')}
            autoComplete="off"
            maxLength={STUDIO_TAX_PROFILE_LIMITS.steuernummer}
            {...register(`${FIELD}.steuernummer`)}
          />
        </div>
        <div className="studio-field-stack">
          <Label htmlFor="studio-tax-ustid">{t('studioSettings.invoicing.ustIdNr')}</Label>
          <Input
            id="studio-tax-ustid"
            placeholder={t('studioSettings.invoicing.ustIdNrPlaceholder')}
            autoComplete="off"
            maxLength={STUDIO_TAX_PROFILE_LIMITS.ustIdNr}
            {...register(`${FIELD}.ustIdNr`)}
          />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="studio-field-stack">
          <Label>{t('studioSettings.invoicing.defaultVatRate')}</Label>
          <Select
            value={String(taxProfile.defaultVatRatePercent)}
            onChange={setDefaultRate}
            options={rateOptions}
            placeholder={t('studioSettings.invoicing.defaultVatRate')}
            disabled={taxProfile.mode !== 'regular_vat'}
          />
          <p className="text-xs text-muted">{t('studioSettings.invoicing.defaultVatRateHint')}</p>
        </div>
        <div className="flex items-end">
          <Switch
            checked={taxProfile.showTaxModeFooterNote}
            onChange={toggleFooterNote}
            label={t('studioSettings.invoicing.showTaxFooterNote')}
          />
        </div>
      </div>

      {taxProfile.mode === 'kleinunternehmer' ? (
        <div className="studio-field-stack">
          <Label htmlFor="studio-tax-kleinunternehmer">
            {t('studioSettings.invoicing.kleinunternehmerNote')}
          </Label>
          <TextArea
            id="studio-tax-kleinunternehmer"
            rows={3}
            placeholder={t('studioSettings.invoicing.kleinunternehmerNotePlaceholder')}
            maxLength={STUDIO_TAX_PROFILE_LIMITS.kleinunternehmerNote}
            {...register(`${FIELD}.kleinunternehmerNote`)}
          />
          {errors.taxProfile?.kleinunternehmerNote ? (
            <p className="text-xs text-destructive">{errors.taxProfile.kleinunternehmerNote.message}</p>
          ) : null}
        </div>
      ) : null}

      {taxProfile.mode === 'reverse_charge' ? (
        <div className="studio-field-stack">
          <Label htmlFor="studio-tax-reverse">{t('studioSettings.invoicing.reverseChargeNote')}</Label>
          <TextArea
            id="studio-tax-reverse"
            rows={3}
            placeholder={t('studioSettings.invoicing.reverseChargeNotePlaceholder')}
            maxLength={STUDIO_TAX_PROFILE_LIMITS.reverseChargeNote}
            {...register(`${FIELD}.reverseChargeNote`)}
          />
          {errors.taxProfile?.reverseChargeNote ? (
            <p className="text-xs text-destructive">{errors.taxProfile.reverseChargeNote.message}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
