'use client'

import { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Label, TextArea } from '@/components/atoms'
import {
  StudioBrandThemePreviewCard,
  StudioDocumentSectionsEditor,
  StudioFlatSection,
  StudioShareLinkDefaultsPanel,
  StudioQuerySubTabs,
  type StudioQuerySubTab,
} from '@/features/studio-settings/components'
import { StudioTemplatesHubSection } from '@/features/studio-settings/sections/StudioTemplatesHubSection'
import type { GeneralForm } from '@/features/studio-settings/sections/studioGeneralForm'
import { StudioGeneralFormShell } from '@/features/studio-settings/sections/StudioGeneralFormShell'

function ProposalDefaultsPanel() {
  const { t } = useTranslation()
  const {
    register,
    formState: { errors },
  } = useFormContext<GeneralForm>()

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">{t('studioSettings.general.proposalTabIntro')}</p>
      <StudioFlatSection
        title={t('studioSettings.general.proposalDefaultsTitle')}
        description={t('studioSettings.general.proposalDefaultsHint')}
      >
        <div className="space-y-2">
          <div className="studio-field-stack">
            <Label htmlFor="studio-default-payment">{t('studioSettings.general.defaultPaymentTerms')}</Label>
            <TextArea
              id="studio-default-payment"
              rows={5}
              placeholder={t('studioSettings.general.defaultPaymentTermsPlaceholder')}
              hint={t('studioSettings.general.defaultPaymentTermsHelp')}
              {...register('defaultPaymentTerms')}
            />
            {errors.defaultPaymentTerms ? (
              <p className="text-xs text-destructive">{errors.defaultPaymentTerms.message}</p>
            ) : null}
          </div>
          <div className="studio-field-stack">
            <Label htmlFor="studio-default-vat">{t('studioSettings.general.defaultVatNote')}</Label>
            <TextArea
              id="studio-default-vat"
              rows={3}
              placeholder={t('studioSettings.general.defaultVatNotePlaceholder')}
              hint={t('studioSettings.general.defaultVatNoteHelp')}
              {...register('defaultVatNote')}
            />
            {errors.defaultVatNote ? (
              <p className="text-xs text-destructive">{errors.defaultVatNote.message}</p>
            ) : null}
          </div>
          <div className="studio-field-stack">
            <Label htmlFor="studio-default-revisions">{t('studioSettings.general.defaultRevisionsNote')}</Label>
            <TextArea
              id="studio-default-revisions"
              rows={5}
              placeholder={t('studioSettings.general.defaultRevisionsNotePlaceholder')}
              hint={t('studioSettings.general.defaultRevisionsNoteHelp')}
              {...register('defaultRevisionsNote')}
            />
            {errors.defaultRevisionsNote ? (
              <p className="text-xs text-destructive">{errors.defaultRevisionsNote.message}</p>
            ) : null}
          </div>
        </div>
      </StudioFlatSection>
      <StudioShareLinkDefaultsPanel />
    </div>
  )
}

function StudioProposalFields() {
  const { t } = useTranslation()

  const tabs = useMemo<readonly StudioQuerySubTab[]>(
    () => [
      {
        id: 'templates',
        label: t('studioSettings.proposalTab.subTabs.templates'),
        content: <StudioTemplatesHubSection kind="proposal" />,
      },
      {
        id: 'defaults',
        label: t('studioSettings.proposalTab.subTabs.defaults'),
        content: <ProposalDefaultsPanel />,
      },
      {
        id: 'sections',
        label: t('studioSettings.proposalTab.subTabs.sections'),
        content: <StudioDocumentSectionsEditor />,
      },
    ],
    [t],
  )

  return (
    <div className="space-y-4">
      <StudioBrandThemePreviewCard contextHintKey="studioSettings.brandKit.proposalThemeHint" />
      <StudioQuerySubTabs tabs={tabs} ariaLabel={t('studioSettings.proposalTab.subNavAria')} />
    </div>
  )
}

export function StudioProposalSection() {
  return (
    <StudioGeneralFormShell>
      <StudioProposalFields />
    </StudioGeneralFormShell>
  )
}
