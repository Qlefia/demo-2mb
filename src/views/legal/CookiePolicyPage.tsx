'use client'

import { useTranslation } from 'react-i18next'
import { Container } from '@/components/atoms'

export function CookiePolicyPage() {
  const { t } = useTranslation()

  return (
    <Container className="py-12">
      <h1 className="text-2xl font-semibold">{t('legal.cookies')}</h1>
      <p className="mt-2 text-xs text-muted">{t('legal.lastUpdated', { date: 'April 2026' })}</p>
      <div className="prose mt-8 max-w-none">
        <h2>{t('legal.cookieWhatCookies')}</h2>
        <p className="whitespace-pre-line">{t('legal.cookieWhatCookiesText')}</p>

        <h2>{t('legal.cookieTable')}</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-border">
            <thead>
              <tr>
                <th className="border border-border px-4 py-2 text-left">
                  {t('legal.cookieTableName')}
                </th>
                <th className="border border-border px-4 py-2 text-left">
                  {t('legal.cookieTablePurpose')}
                </th>
                <th className="border border-border px-4 py-2 text-left">
                  {t('legal.cookieTableDuration')}
                </th>
                <th className="border border-border px-4 py-2 text-left">
                  {t('legal.cookieTableCategory')}
                </th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4].map((row) => (
                <tr key={row}>
                  <td className="border border-border px-4 py-2 font-mono text-xs">
                    {t(`legal.cookieTableRow${row}Name`)}
                  </td>
                  <td className="border border-border px-4 py-2">
                    {t(`legal.cookieTableRow${row}Purpose`)}
                  </td>
                  <td className="border border-border px-4 py-2">
                    {t(`legal.cookieTableRow${row}Duration`)}
                  </td>
                  <td className="border border-border px-4 py-2">
                    {t(`legal.cookieTableRow${row}Category`)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>{t('legal.cookieManageConsent')}</h2>
        <p className="whitespace-pre-line">{t('legal.cookieManageConsentText')}</p>
      </div>
    </Container>
  )
}
