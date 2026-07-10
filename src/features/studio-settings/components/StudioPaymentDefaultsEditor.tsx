'use client'

import { useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Input, Label, TextArea } from '@/components/atoms'
import { Select } from '@/components/molecules/Select'
import { STUDIO_PAYMENT_DEFAULTS_LIMITS } from '@/features/studio-settings/constants'
import {
  STUDIO_LEISTUNGSZEITRAUM_POLICIES,
  type StudioLeistungszeitraumPolicy,
} from '@/stores/studioProfileTypes'
import type { GeneralForm } from '@/features/studio-settings/sections/studioGeneralForm'

const FIELD = 'paymentDefaults' as const

export function StudioPaymentDefaultsEditor() {
  const { t } = useTranslation()
  const { control, setValue, register } = useFormContext<GeneralForm>()
  const payment = useWatch({ control, name: FIELD }) as GeneralForm['paymentDefaults']

  const leistungsPolicyOptions = STUDIO_LEISTUNGSZEITRAUM_POLICIES.map((p) => ({
    value: p,
    label: t(`studioSettings.invoicing.leistungszeitraumPolicy.${p}`),
  }))

  function patchNumber(name: keyof Omit<GeneralForm['paymentDefaults'], 'lateFeeNote' | 'leistungszeitraumPolicy'>, raw: string) {
    if (raw.trim() === '') return
    const parsed = name === 'skontoPercent' || name === 'lateFeePercentPerMonth' ? Number.parseFloat(raw) : Number.parseInt(raw, 10)
    if (!Number.isFinite(parsed)) return
    setValue(`${FIELD}.${name}`, parsed, { shouldDirty: true, shouldTouch: true })
  }

  function setPolicy(next: string) {
    setValue(`${FIELD}.leistungszeitraumPolicy`, next as StudioLeistungszeitraumPolicy, {
      shouldDirty: true,
      shouldTouch: true,
    })
  }

  if (!payment) return null

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="studio-field-stack">
          <Label>{t('studioSettings.invoicing.netDays')}</Label>
          <Input
            type="number"
            inputMode="numeric"
            min={STUDIO_PAYMENT_DEFAULTS_LIMITS.netDaysMin}
            max={STUDIO_PAYMENT_DEFAULTS_LIMITS.netDaysMax}
            value={String(payment.netDays)}
            onChange={(e) => patchNumber('netDays', e.target.value)}
          />
        </div>
        <div className="studio-field-stack">
          <Label>{t('studioSettings.invoicing.skontoPercent')}</Label>
          <Input
            type="number"
            inputMode="decimal"
            step="0.1"
            min={STUDIO_PAYMENT_DEFAULTS_LIMITS.skontoPercentMin}
            max={STUDIO_PAYMENT_DEFAULTS_LIMITS.skontoPercentMax}
            value={String(payment.skontoPercent)}
            onChange={(e) => patchNumber('skontoPercent', e.target.value)}
          />
        </div>
        <div className="studio-field-stack">
          <Label>{t('studioSettings.invoicing.skontoDays')}</Label>
          <Input
            type="number"
            inputMode="numeric"
            min={STUDIO_PAYMENT_DEFAULTS_LIMITS.skontoDaysMin}
            max={STUDIO_PAYMENT_DEFAULTS_LIMITS.skontoDaysMax}
            value={String(payment.skontoDays)}
            onChange={(e) => patchNumber('skontoDays', e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_2fr]">
        <div className="studio-field-stack">
          <Label>{t('studioSettings.invoicing.lateFeePercent')}</Label>
          <Input
            type="number"
            inputMode="decimal"
            step="0.1"
            min={STUDIO_PAYMENT_DEFAULTS_LIMITS.lateFeePercentMin}
            max={STUDIO_PAYMENT_DEFAULTS_LIMITS.lateFeePercentMax}
            value={String(payment.lateFeePercentPerMonth)}
            onChange={(e) => patchNumber('lateFeePercentPerMonth', e.target.value)}
          />
        </div>
        <div className="studio-field-stack">
          <Label>{t('studioSettings.invoicing.lateFeeNote')}</Label>
          <TextArea
            rows={2}
            placeholder={t('studioSettings.invoicing.lateFeeNotePlaceholder')}
            maxLength={STUDIO_PAYMENT_DEFAULTS_LIMITS.lateFeeNote}
            {...register(`${FIELD}.lateFeeNote`)}
          />
        </div>
      </div>

      <div className="studio-field-stack">
        <Label>{t('studioSettings.invoicing.leistungszeitraumLabel')}</Label>
        <Select
          value={payment.leistungszeitraumPolicy}
          onChange={setPolicy}
          options={leistungsPolicyOptions}
          placeholder={t('studioSettings.invoicing.leistungszeitraumLabel')}
        />
        <p className="text-xs text-muted">{t('studioSettings.invoicing.leistungszeitraumHint')}</p>
      </div>
    </div>
  )
}
