'use client'

import { useTranslation } from 'react-i18next'
import { Container } from '@/components/atoms'

export function ImpressumPage() {
  const { t } = useTranslation()
  return (
    <Container className="py-12">
      <h1 className="text-2xl font-semibold">{t('legal.impressum')}</h1>
      <p className="mt-2 text-xs text-muted">{t('legal.lastUpdated', { date: 'March 2026' })}</p>
      <div className="prose mt-8 max-w-none">
        <h2>{t('legal.impressumCompanyName')}</h2>
        <p className="whitespace-pre-line">{t('legal.impressumCompanyNameText')}</p>

        <h2>{t('legal.impressumAddress')}</h2>
        <p className="whitespace-pre-line">{t('legal.impressumAddressText')}</p>

        <h2>{t('legal.impressumContact')}</h2>
        <p className="whitespace-pre-line">{t('legal.impressumContactText')}</p>

        <h2>{t('legal.impressumHandelsregister')}</h2>
        <p className="whitespace-pre-line">{t('legal.impressumHandelsregisterText')}</p>

        <h2>{t('legal.impressumUstId')}</h2>
        <p className="whitespace-pre-line">{t('legal.impressumUstIdText')}</p>

        <h2>{t('legal.impressumResponsibleEditor')}</h2>
        <p className="whitespace-pre-line">{t('legal.impressumResponsibleEditorText')}</p>
      </div>
    </Container>
  )
}
