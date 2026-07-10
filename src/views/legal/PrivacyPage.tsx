'use client'

import { useTranslation } from 'react-i18next'
import { Container } from '@/components/atoms'

export function PrivacyPage() {
  const { t } = useTranslation()
  return (
    <Container className="py-12">
      <h1 className="text-2xl font-semibold">{t('legal.privacy')}</h1>
      <p className="mt-2 text-xs text-muted">{t('legal.lastUpdated', { date: 'March 2026' })}</p>
      <div className="prose mt-8 max-w-none">
        <h2>{t('legal.privacyDataController')}</h2>
        <p className="whitespace-pre-line">{t('legal.privacyDataControllerText')}</p>

        <h2>{t('legal.privacyDataCollected')}</h2>
        <p className="whitespace-pre-line">{t('legal.privacyDataCollectedText')}</p>

        <h2>{t('legal.privacyLegalBasis')}</h2>
        <p className="whitespace-pre-line">{t('legal.privacyLegalBasisText')}</p>

        <h2>{t('legal.privacyRetentionPeriod')}</h2>
        <p className="whitespace-pre-line">{t('legal.privacyRetentionPeriodText')}</p>

        <h2>{t('legal.privacyDataSubjectRights')}</h2>
        <p className="whitespace-pre-line">{t('legal.privacyDataSubjectRightsText')}</p>

        <h2>{t('legal.privacySubProcessors')}</h2>
        <p className="whitespace-pre-line">{t('legal.privacySubProcessorsText')}</p>

        <h2>{t('legal.privacyDpoContact')}</h2>
        <p className="whitespace-pre-line">{t('legal.privacyDpoContactText')}</p>
      </div>
    </Container>
  )
}
