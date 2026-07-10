'use client'

import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Input, Label } from '@/components/atoms'
import { StudioFlatSection } from '@/features/studio-settings/components'
import type { GeneralForm } from '@/features/studio-settings/sections/studioGeneralForm'

export function StudioShareLinkDefaultsPanel() {
  const { t } = useTranslation()
  const {
    register,
    formState: { errors },
  } = useFormContext<GeneralForm>()

  return (
    <StudioFlatSection
      title={t('studioSettings.general.shareLinkDefaultsTitle')}
      description={t('studioSettings.general.shareLinkDefaultsHint')}
    >
      <div className="studio-field-stack max-w-xs">
        <Label htmlFor="studio-share-link-validity">{t('studioSettings.general.shareLinkValidityDays')}</Label>
        <Input
          id="studio-share-link-validity"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={t('studioSettings.general.shareLinkValidityDaysPlaceholder')}
          {...register('shareLinkValidityDays')}
        />
        {errors.shareLinkValidityDays ? (
          <p className="text-xs text-destructive">{errors.shareLinkValidityDays.message}</p>
        ) : null}
      </div>
    </StudioFlatSection>
  )
}
