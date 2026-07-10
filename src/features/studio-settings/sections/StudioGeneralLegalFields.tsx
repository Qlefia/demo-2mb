'use client'

import type { ReactNode } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Input, Label, TextArea } from '@/components/atoms'
import type { GeneralForm } from '@/features/studio-settings/sections/studioGeneralForm'
import {
  studioEditorPanelBody,
  studioFieldStack,
} from '@/features/studio-settings/studioBlockChrome'

interface LegalGroupProps {
  title: string
  description?: string
  children: ReactNode
}

function LegalGroup({ title, description, children }: LegalGroupProps) {
  return (
    <div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description ? <p className="mt-0.5 text-xs text-muted">{description}</p> : null}
      <div className="mt-3 grid gap-[var(--studio-stack-block-gap)] sm:grid-cols-2">{children}</div>
    </div>
  )
}

export function StudioGeneralLegalFields() {
  const { t } = useTranslation()
  const {
    register,
    formState: { errors },
  } = useFormContext<GeneralForm>()

  return (
    <div className={studioEditorPanelBody}>
      <LegalGroup
        title={t('studioSettings.general.companySectionTitle')}
        description={t('studioSettings.general.companySectionBody')}
      >
        <div className={`${studioFieldStack} sm:col-span-2`}>
          <Label htmlFor="studio-legal-entity">
            {t('studioSettings.general.legalEntityName')}
          </Label>
          <Input id="studio-legal-entity" {...register('legalEntityName')} />
          {errors.legalEntityName ? (
            <p className="text-xs text-destructive">{errors.legalEntityName.message}</p>
          ) : null}
        </div>
        <div className={`${studioFieldStack} sm:col-span-2`}>
          <Label htmlFor="studio-trading-name">{t('studioSettings.general.tradingName')}</Label>
          <Input id="studio-trading-name" {...register('tradingName')} />
          {errors.tradingName ? (
            <p className="text-xs text-destructive">{errors.tradingName.message}</p>
          ) : null}
        </div>
        <div className={`${studioFieldStack} sm:col-span-2`}>
          <Label htmlFor="studio-registration">
            {t('studioSettings.general.registrationDetails')}
          </Label>
          <p className="text-xs text-muted">
            {t('studioSettings.general.registrationDetailsHint')}
          </p>
          <TextArea id="studio-registration" rows={3} {...register('registrationDetails')} />
          {errors.registrationDetails ? (
            <p className="text-xs text-destructive">{errors.registrationDetails.message}</p>
          ) : null}
        </div>
        <div className={studioFieldStack}>
          <Label htmlFor="studio-vat">{t('studioSettings.general.vatId')}</Label>
          <Input id="studio-vat" {...register('vatId')} />
          {errors.vatId ? (
            <p className="text-xs text-destructive">{errors.vatId.message}</p>
          ) : null}
        </div>
      </LegalGroup>

      <LegalGroup title={t('studioSettings.general.addressSectionTitle')}>
        <div className={`${studioFieldStack} sm:col-span-2`}>
          <Label htmlFor="studio-addr-street">{t('studioSettings.general.addressStreet')}</Label>
          <Input id="studio-addr-street" {...register('addressStreet')} />
          {errors.addressStreet ? (
            <p className="text-xs text-destructive">{errors.addressStreet.message}</p>
          ) : null}
        </div>
        <div className={`${studioFieldStack} sm:col-span-2`}>
          <Label htmlFor="studio-addr-line2">{t('studioSettings.general.addressLine2')}</Label>
          <Input id="studio-addr-line2" {...register('addressLine2')} />
          {errors.addressLine2 ? (
            <p className="text-xs text-destructive">{errors.addressLine2.message}</p>
          ) : null}
        </div>
        <div className={studioFieldStack}>
          <Label htmlFor="studio-addr-postal">
            {t('studioSettings.general.addressPostalCode')}
          </Label>
          <Input id="studio-addr-postal" {...register('addressPostalCode')} />
          {errors.addressPostalCode ? (
            <p className="text-xs text-destructive">{errors.addressPostalCode.message}</p>
          ) : null}
        </div>
        <div className={studioFieldStack}>
          <Label htmlFor="studio-addr-locality">
            {t('studioSettings.general.addressLocality')}
          </Label>
          <Input id="studio-addr-locality" {...register('addressLocality')} />
          {errors.addressLocality ? (
            <p className="text-xs text-destructive">{errors.addressLocality.message}</p>
          ) : null}
        </div>
        <div className={`${studioFieldStack} sm:col-span-2`}>
          <Label htmlFor="studio-addr-country">{t('studioSettings.general.addressCountry')}</Label>
          <Input id="studio-addr-country" {...register('addressCountry')} />
          {errors.addressCountry ? (
            <p className="text-xs text-destructive">{errors.addressCountry.message}</p>
          ) : null}
        </div>
      </LegalGroup>

      <LegalGroup
        title={t('studioSettings.general.officeSectionTitle')}
        description={t('studioSettings.general.officeSectionHint')}
      >
        <div className={studioFieldStack}>
          <Label htmlFor="studio-office-phone">{t('studioSettings.general.officePhone')}</Label>
          <Input id="studio-office-phone" type="tel" {...register('officePhone')} />
          {errors.officePhone ? (
            <p className="text-xs text-destructive">{errors.officePhone.message}</p>
          ) : null}
        </div>
        <div className={studioFieldStack}>
          <Label htmlFor="studio-office-email">{t('studioSettings.general.officeEmail')}</Label>
          <Input id="studio-office-email" type="email" {...register('officeEmail')} />
          {errors.officeEmail ? (
            <p className="text-xs text-destructive">{errors.officeEmail.message}</p>
          ) : null}
        </div>
      </LegalGroup>

      <LegalGroup
        title={t('studioSettings.general.signingPrimaryTitle')}
        description={t('studioSettings.general.signingPrimaryHint')}
      >
        <div className={studioFieldStack}>
          <Label htmlFor="studio-sign-name">{t('studioSettings.general.signingName')}</Label>
          <Input id="studio-sign-name" {...register('signingName')} />
          {errors.signingName ? (
            <p className="text-xs text-destructive">{errors.signingName.message}</p>
          ) : null}
        </div>
        <div className={studioFieldStack}>
          <Label htmlFor="studio-sign-role">{t('studioSettings.general.signingRole')}</Label>
          <Input id="studio-sign-role" {...register('signingRole')} />
          {errors.signingRole ? (
            <p className="text-xs text-destructive">{errors.signingRole.message}</p>
          ) : null}
        </div>
        <div className={studioFieldStack}>
          <Label htmlFor="studio-sign-email">{t('studioSettings.general.signingEmail')}</Label>
          <Input id="studio-sign-email" type="email" {...register('signingEmail')} />
          {errors.signingEmail ? (
            <p className="text-xs text-destructive">{errors.signingEmail.message}</p>
          ) : null}
        </div>
        <div className={studioFieldStack}>
          <Label htmlFor="studio-sign-phone">{t('studioSettings.general.signingPhone')}</Label>
          <Input id="studio-sign-phone" type="tel" {...register('signingPhone')} />
          {errors.signingPhone ? (
            <p className="text-xs text-destructive">{errors.signingPhone.message}</p>
          ) : null}
        </div>
      </LegalGroup>

      <LegalGroup
        title={t('studioSettings.general.regulatorySectionTitle')}
        description={t('studioSettings.general.supervisoryAuthorityHint')}
      >
        <div className={`${studioFieldStack} sm:col-span-2`}>
          <Label htmlFor="studio-supervisory">
            {t('studioSettings.general.supervisoryAuthority')}
          </Label>
          <TextArea id="studio-supervisory" rows={4} {...register('supervisoryAuthority')} />
          {errors.supervisoryAuthority ? (
            <p className="text-xs text-destructive">{errors.supervisoryAuthority.message}</p>
          ) : null}
        </div>
      </LegalGroup>

      <LegalGroup title={t('studioSettings.general.insuranceSectionTitle')}>
        <div className={`${studioFieldStack} sm:col-span-2`}>
          <Label htmlFor="studio-liability-insurer">
            {t('studioSettings.general.professionalLiabilityInsurance')}
          </Label>
          <p className="text-xs text-muted">
            {t('studioSettings.general.professionalLiabilityInsuranceHint')}
          </p>
          <TextArea
            id="studio-liability-insurer"
            rows={3}
            {...register('professionalLiabilityInsurance')}
          />
          {errors.professionalLiabilityInsurance ? (
            <p className="text-xs text-destructive">
              {errors.professionalLiabilityInsurance.message}
            </p>
          ) : null}
        </div>
        <div className={`${studioFieldStack} sm:col-span-2`}>
          <Label htmlFor="studio-insurance-scope">
            {t('studioSettings.general.insuranceCoverageScope')}
          </Label>
          <p className="text-xs text-muted">
            {t('studioSettings.general.insuranceCoverageScopeHint')}
          </p>
          <TextArea id="studio-insurance-scope" rows={3} {...register('insuranceCoverageScope')} />
          {errors.insuranceCoverageScope ? (
            <p className="text-xs text-destructive">{errors.insuranceCoverageScope.message}</p>
          ) : null}
        </div>
      </LegalGroup>

      <LegalGroup
        title={t('studioSettings.general.visualizationCreditsSectionTitle')}
        description={t('studioSettings.general.visualizationCreditsHint')}
      >
        <div className={`${studioFieldStack} sm:col-span-2`}>
          <Label htmlFor="studio-viz-credits">
            {t('studioSettings.general.visualizationCredits')}
          </Label>
          <TextArea id="studio-viz-credits" rows={2} {...register('visualizationCredits')} />
          {errors.visualizationCredits ? (
            <p className="text-xs text-destructive">{errors.visualizationCredits.message}</p>
          ) : null}
        </div>
      </LegalGroup>

      <LegalGroup title={t('studioSettings.general.signingSecondaryTitle')}>
        <div className={studioFieldStack}>
          <Label htmlFor="studio-sign2-name">
            {t('studioSettings.optionalFieldLabel', {
              field: t('studioSettings.general.signingName'),
            })}
          </Label>
          <Input id="studio-sign2-name" {...register('signing2Name')} />
          {errors.signing2Name ? (
            <p className="text-xs text-destructive">{errors.signing2Name.message}</p>
          ) : null}
        </div>
        <div className={studioFieldStack}>
          <Label htmlFor="studio-sign2-role">
            {t('studioSettings.optionalFieldLabel', {
              field: t('studioSettings.general.signingRole'),
            })}
          </Label>
          <Input id="studio-sign2-role" {...register('signing2Role')} />
          {errors.signing2Role ? (
            <p className="text-xs text-destructive">{errors.signing2Role.message}</p>
          ) : null}
        </div>
        <div className={`${studioFieldStack} sm:col-span-2`}>
          <Label htmlFor="studio-sign2-email">
            {t('studioSettings.optionalFieldLabel', {
              field: t('studioSettings.general.signingEmail'),
            })}
          </Label>
          <Input id="studio-sign2-email" type="email" {...register('signing2Email')} />
          {errors.signing2Email ? (
            <p className="text-xs text-destructive">{errors.signing2Email.message}</p>
          ) : null}
        </div>
      </LegalGroup>
    </div>
  )
}
