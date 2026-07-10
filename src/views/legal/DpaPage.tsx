'use client'

import { useTranslation } from 'react-i18next'
import { Button, Container } from '@/components/atoms'

const SUB_PROCESSORS = [
  'Supabase',
  'Cloudflare',
  'Sentry',
  'Umami',
  'Vercel',
  'ElevenLabs',
  'HeyGen',
] as const

export function DpaPage() {
  const { t } = useTranslation()
  return (
    <Container className="py-12">
      <h1 className="text-2xl font-semibold">{t('legal.dpa')}</h1>
      <p className="mt-2 text-xs text-muted">{t('legal.lastUpdated', { date: 'March 2026' })}</p>
      <div className="prose mt-8 max-w-none">
        <h2>{t('legal.dpaSubjectDuration')}</h2>
        <p className="whitespace-pre-line">{t('legal.dpaSubjectDurationText')}</p>

        <h2>{t('legal.dpaScopeProcessing')}</h2>
        <p className="whitespace-pre-line">{t('legal.dpaScopeProcessingText')}</p>

        <h2>{t('legal.dpaRightsObligations')}</h2>
        <p className="whitespace-pre-line">{t('legal.dpaRightsObligationsText')}</p>

        <h2>{t('legal.dpaSubProcessors')}</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-border">
            <thead>
              <tr>
                <th className="border border-border px-4 py-2 text-left">{t('legal.dpaTableProcessor')}</th>
                <th className="border border-border px-4 py-2 text-left">{t('legal.dpaTableLocation')}</th>
                <th className="border border-border px-4 py-2 text-left">{t('legal.dpaTablePurpose')}</th>
              </tr>
            </thead>
            <tbody>
              {SUB_PROCESSORS.map((name) => (
                <tr key={name}>
                  <td className="border border-border px-4 py-2 font-medium">{name}</td>
                  <td className="border border-border px-4 py-2">
                    {t(`legal.dpaSubProcessor${name}Location`)}
                  </td>
                  <td className="border border-border px-4 py-2">
                    {t(`legal.dpaSubProcessor${name}Purpose`)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>{t('legal.dpaTechnicalMeasures')}</h2>
        <p className="whitespace-pre-line">{t('legal.dpaTechnicalMeasuresText')}</p>

        <div className="mt-8">
          <Button disabled>{t('legal.dpaDownloadPdf')}</Button>
        </div>
      </div>
    </Container>
  )
}
