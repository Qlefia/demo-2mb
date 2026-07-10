'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/atoms'
import { appFetch } from '@/lib/http/appFetch'
import { useUserStore } from '@/stores/userStore'
import { formatDate } from '@/lib/intl/datetime'

interface ConsentEntry {
  id: string
  date: string
  type: string
  status: string
}

const CONSENT_LOG_INITIAL = 10

export function ConsentLog() {
  const { t, i18n } = useTranslation()
  const userId = useUserStore((s) => s.user.id)
  const [entries, setEntries] = useState<ConsentEntry[]>([])
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    appFetch('/api/me/consent-log', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { items?: Array<{ id: string; consent_type: string; status: string; created_at: string }> } | null) => {
        if (cancelled || !payload?.items) return
        setEntries(
          payload.items.map((r) => ({
            id: String(r.id),
            date: formatDate(r.created_at, i18n.language),
            type: r.consent_type,
            status: r.status,
          })),
        )
      })
    return () => { cancelled = true }
  }, [userId, i18n.language])

  const hasMore = entries.length > CONSENT_LOG_INITIAL
  const hiddenCount = Math.max(0, entries.length - CONSENT_LOG_INITIAL)
  const visibleEntries = expanded || !hasMore ? entries : entries.slice(0, CONSENT_LOG_INITIAL)

  return (
    <div className="overflow-hidden rounded-sm border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-primary/5">
            <th className="px-4 py-2 text-left font-medium">{t('settingsPage.consentDate')}</th>
            <th className="px-4 py-2 text-left font-medium">{t('settingsPage.consentType')}</th>
            <th className="px-4 py-2 text-left font-medium">{t('settingsPage.consentStatus')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {entries.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-4 py-4 text-center text-muted">
                {t('common.noData')}
              </td>
            </tr>
          ) : (
            visibleEntries.map((entry) => (
              <tr key={entry.id}>
                <td className="px-4 py-2.5 text-muted">{entry.date}</td>
                <td className="px-4 py-2.5">{entry.type}</td>
                <td className="px-4 py-2.5">
                  <Badge variant={entry.status === 'accepted' ? 'success' : 'default'}>
                    {entry.status}
                  </Badge>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {hasMore && (
        <div className="border-t border-border bg-primary/2 px-4 py-2.5">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="text-sm font-medium text-foreground underline underline-offset-2 hover:text-primary"
          >
            {expanded
              ? t('settingsPage.consentLogShowLess')
              : t('settingsPage.consentLogShowMore', { count: hiddenCount })}
          </button>
        </div>
      )}
    </div>
  )
}
