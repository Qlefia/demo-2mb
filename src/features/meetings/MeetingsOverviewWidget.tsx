'use client'

import { useTranslation } from 'react-i18next'
import { Calendar, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/atoms'
import { studioTintPanel } from '@/features/studio-settings/studioBlockChrome'
import { useProspectMeetingsQuery } from '@/features/meetings/api/useProspectMeetingsQuery'
import { formatDateTime } from '@/lib/intl/datetime'

interface MeetingsOverviewWidgetProps {
  prospectId: string
  onViewAll: () => void
  onSchedule: () => void
}

export function MeetingsOverviewWidget({ prospectId, onViewAll, onSchedule }: MeetingsOverviewWidgetProps) {
  const { t, i18n } = useTranslation()
  const meetingsQuery = useProspectMeetingsQuery(prospectId)
  const items = meetingsQuery.data ?? []

  const now = Date.now()
  const upcoming = items
    .filter((m) => m.status === 'scheduled' && new Date(m.startsAt).getTime() >= now - 30 * 60 * 1000)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  const next = upcoming[0] ?? null

  return (
    <section className={studioTintPanel}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="crm-meta-label">{t('prospects.workspace.meetingsTitle')}</h2>
          {meetingsQuery.isLoading ? (
            <p className="mt-2 text-sm text-muted">{t('common.loading')}</p>
          ) : next ? (
            <div className="mt-2 flex items-start gap-2 text-sm">
              <Calendar size={14} className="mt-0.5 shrink-0 text-muted" aria-hidden />
              <div className="min-w-0">
                <p className="font-medium truncate">{next.title}</p>
                <p className="text-xs text-muted">{formatDateTime(next.startsAt, i18n.language)}</p>
                {upcoming.length > 1 ? (
                  <p className="mt-1 text-xs text-muted">{t('meetings.moreUpcoming', { count: upcoming.length - 1 })}</p>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">{t('meetings.emptyShort')}</p>
          )}
        </div>
        <Button type="button" size="sm" variant="ghost" onClick={onViewAll} className="shrink-0">
          {t('meetings.viewAll')}
          <ChevronRight size={14} className="ml-0.5" aria-hidden />
        </Button>
      </div>
      <Button type="button" size="sm" variant="secondary" className="mt-3" onClick={onSchedule}>
        <Plus size={14} className="mr-1" aria-hidden />
        {t('meetings.add')}
      </Button>
    </section>
  )
}
