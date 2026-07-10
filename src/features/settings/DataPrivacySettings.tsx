'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Download, FileText, Server, Shield } from 'lucide-react'
import { Button } from '@/components/atoms'
import { appFetch } from '@/lib/http/appFetch'
import { ConsentLog } from './ConsentLog'
import { DangerZone } from './DangerZone'

interface LegalRow {
  id: string
  href: string
  titleKey: string
  descKey: string
}

const LEGAL_ROWS: LegalRow[] = [
  { id: 'impressum', href: '/legal/impressum', titleKey: 'footer.impressum', descKey: 'settingsPage.legalDocImpressumDesc' },
  { id: 'privacy', href: '/legal/privacy', titleKey: 'footer.privacy', descKey: 'settingsPage.legalDocPrivacyDesc' },
  { id: 'terms', href: '/legal/terms', titleKey: 'footer.terms', descKey: 'settingsPage.legalDocTermsDesc' },
  { id: 'cookies', href: '/legal/cookies', titleKey: 'footer.cookies', descKey: 'settingsPage.legalDocCookiesDesc' },
  { id: 'dpa', href: '/legal/dpa', titleKey: 'footer.dpa', descKey: 'settingsPage.legalDocDpaDesc' },
]

type ExportStatus = 'idle' | 'preparing' | 'ready'

export function DataPrivacySettings() {
  const { t } = useTranslation()
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle')

  const handleExportRequest = async () => {
    setExportStatus('preparing')
    const res = await appFetch('/api/account/export')
    if (!res.ok) {
      setExportStatus('idle')
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `data-export-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    setExportStatus('ready')
  }

  return (
    <div className="max-w-2xl space-y-10">
      <section>
        <div className="flex items-center gap-2 mb-1">
          <Download size={16} className="text-muted" />
          <h3 className="text-sm font-medium">{t('settingsPage.exportData')}</h3>
        </div>
        <p className="text-sm text-muted mb-4">{t('settingsPage.exportDataDesc')}</p>
        {exportStatus === 'idle' && (
          <Button variant="secondary" onClick={handleExportRequest}>
            {t('settingsPage.requestExport')}
          </Button>
        )}
        {exportStatus === 'preparing' && (
          <p className="text-sm text-muted">{t('settingsPage.exportPreparing')}</p>
        )}
        {exportStatus === 'ready' && (
          <div className="space-y-2">
            <p className="text-sm text-muted">{t('settingsPage.exportReady')}</p>
            <Button variant="secondary" onClick={() => setExportStatus('idle')}>
              {t('settingsPage.requestExport')}
            </Button>
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-1">
          <Shield size={16} className="text-muted" />
          <h3 className="text-sm font-medium">{t('settingsPage.consentLog')}</h3>
        </div>
        <p className="text-sm text-muted mb-4">{t('settingsPage.consentLogDesc')}</p>
        <ConsentLog />
      </section>

      <section>
        <div className="flex items-center gap-2 mb-1">
          <Server size={16} className="text-muted" />
          <h3 className="text-sm font-medium">{t('settingsPage.connectedServices')}</h3>
        </div>
        <p className="text-sm text-muted mb-4">{t('settingsPage.connectedServicesDesc')}</p>
        <div className="rounded-sm border border-border">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border">
              {[
                { name: 'Supabase', purpose: 'Database, Auth, Storage' },
                { name: 'Cloudflare', purpose: 'CDN, DNS, WAF' },
                { name: 'Sentry', purpose: 'Error tracking' },
                { name: 'Vercel', purpose: 'Hosting' },
              ].map((svc) => (
                <tr key={svc.name}>
                  <td className="px-4 py-2.5 font-medium">{svc.name}</td>
                  <td className="px-4 py-2.5 text-muted">{svc.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-1">
          <FileText size={16} className="text-muted" />
          <h3 className="text-sm font-medium">{t('settingsPage.legalDocuments')}</h3>
        </div>
        <p className="text-sm text-muted mb-4">{t('settingsPage.legalDocumentsDesc')}</p>
        <div className="rounded-sm border border-border">
          <table className="w-full text-sm" aria-label={t('settingsPage.legalDocuments')}>
            <tbody className="divide-y divide-border">
              {LEGAL_ROWS.map((row) => (
                <tr key={row.id}>
                  <td className="p-0">
                    <Link
                      href={row.href}
                      className="a11y-strong-focus flex w-full items-center gap-3 px-4 py-3 text-left no-underline transition-colors hover:bg-primary/5 focus-visible:bg-primary/5"
                    >
                      <span className="min-w-0 flex-1 flex flex-col gap-1">
                        <span className="font-medium text-foreground">{t(row.titleKey)}</span>
                        <span className="text-muted leading-snug">{t(row.descKey)}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <DangerZone />
    </div>
  )
}
