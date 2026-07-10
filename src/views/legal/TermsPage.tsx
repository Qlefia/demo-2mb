'use client'

import { useTranslation } from 'react-i18next'
import { Container } from '@/components/atoms'

export function TermsPage() {
  const { t } = useTranslation()
  return (
    <Container className="py-12">
      <h1 className="text-2xl font-semibold">{t('legal.terms')}</h1>
      <p className="mt-2 text-xs text-muted">{t('legal.lastUpdated', { date: 'March 2026' })}</p>
      <div className="prose mt-8 max-w-none">
        <h2>{t('legal.termsServiceDescription')}</h2>
        <p className="whitespace-pre-line">{t('legal.termsServiceDescriptionText')}</p>

        <h2>{t('legal.termsRegistration')}</h2>
        <p className="whitespace-pre-line">{t('legal.termsRegistrationText')}</p>

        <h2>{t('legal.termsPlansPayment')}</h2>
        <p className="whitespace-pre-line">{t('legal.termsPlansPaymentText')}</p>

        <h2>{t('legal.termsContentLiability')}</h2>
        <p className="whitespace-pre-line">{t('legal.termsContentLiabilityText')}</p>

        <h2>{t('legal.termsLimitationOfLiability')}</h2>
        <p className="whitespace-pre-line">{t('legal.termsLimitationOfLiabilityText')}</p>

        <h2>{t('legal.termsTermination')}</h2>
        <p className="whitespace-pre-line">{t('legal.termsTerminationText')}</p>

        <h2>{t('legal.termsGoverningLaw')}</h2>
        <p className="whitespace-pre-line">{t('legal.termsGoverningLawText')}</p>
      </div>
    </Container>
  )
}
