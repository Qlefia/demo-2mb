'use client'

import { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Input, Label } from '@/components/atoms'
import {
  StudioBrandThemePreviewCard,
  StudioDocumentSectionsEditor,
  StudioFlatSection,
  StudioShareLinkDefaultsPanel,
  StudioNumberingEditor,
  StudioQuerySubTabs,
  type StudioQuerySubTab,
} from '@/features/studio-settings/components'
import { StudioTemplatesHubSection } from '@/features/studio-settings/sections/StudioTemplatesHubSection'
import type { GeneralForm } from '@/features/studio-settings/sections/studioGeneralForm'
import { StudioGeneralFormShell } from '@/features/studio-settings/sections/StudioGeneralFormShell'

function OfferDefaultsPanel() {
  const { t } = useTranslation()
  const {
    register,
    formState: { errors },
  } = useFormContext<GeneralForm>()

  return (
    <div className="space-y-4">
      <StudioFlatSection
        title={t('studioSettings.general.proposalDefaultsTitle')}
        description={t('studioSettings.general.offerTabHint')}
      >
        <div className="studio-field-stack max-w-xs">
          <Label htmlFor="studio-offer-validity">{t('studioSettings.general.offerValidityDays')}</Label>
          <Input
            id="studio-offer-validity"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder={t('studioSettings.general.offerValidityDaysPlaceholder')}
            {...register('offerValidityDays')}
          />
          {errors.offerValidityDays ? (
            <p className="text-xs text-destructive">{errors.offerValidityDays.message}</p>
          ) : null}
        </div>
      </StudioFlatSection>

      <StudioFlatSection
        title={t('studioSettings.invoicing.offerNumberingTitle')}
        description={t('studioSettings.invoicing.offerNumberingDescription')}
      >
        <StudioNumberingEditor field="offerNumbering" />
      </StudioFlatSection>

      <StudioShareLinkDefaultsPanel />
    </div>
  )
}

function StudioOfferFields() {
  const { t } = useTranslation()

  const tabs = useMemo<readonly StudioQuerySubTab[]>(
    () => [
      {
        id: 'templates',
        label: t('studioSettings.offerTab.subTabs.templates'),
        content: <StudioTemplatesHubSection kind="offer" />,
      },
      {
        id: 'defaults',
        label: t('studioSettings.offerTab.subTabs.defaults'),
        content: <OfferDefaultsPanel />,
      },
      {
        id: 'sections',
        label: t('studioSettings.offerTab.subTabs.sections'),
        content: <StudioDocumentSectionsEditor />,
      },
    ],
    [t],
  )

  return (
    <div className="space-y-4">
      <StudioBrandThemePreviewCard contextHintKey="studioSettings.brandKit.offerThemeHint" />
      <StudioQuerySubTabs tabs={tabs} ariaLabel={t('studioSettings.offerTab.subNavAria')} />
    </div>
  )
}

export function StudioOfferSection() {
  return (
    <StudioGeneralFormShell>
      <StudioOfferFields />
    </StudioGeneralFormShell>
  )
}
