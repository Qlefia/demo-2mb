'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { Button, Container, PageLoadingCenter } from '@/components/atoms'
import { cn } from '@/lib/cn'
import { ProspectKanban } from '@/features/prospects'
import type { Prospect } from '@/features/prospects'
import type { ActivityDTO } from '@/features/activities/types'
import { formatDateTime } from '@/lib/intl/datetime'
import type { TeamWorkloadSnapshot } from '@/lib/team/workload'
import type { WeeklyTouchBucket } from '@/lib/team/kpiSeries'

interface TeamPayload {
  userId: string
  targetDisplayName?: string | null
  workload: TeamWorkloadSnapshot
  kpiSeries: WeeklyTouchBucket[]
  prospects: Prospect[]
  activities: ActivityDTO[]
}

type Tab = 'pipeline' | 'activity' | 'kpi'

export function TeamMemberPage() {
  const { t, i18n } = useTranslation()
  const params = useParams()
  const router = useRouter()
  const userId = typeof params.userId === 'string' ? params.userId : null

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<'forbidden' | 'failed' | null>(null)
  const [data, setData] = useState<TeamPayload | null>(null)
  const [tab, setTab] = useState<Tab>('pipeline')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/team/${userId}?_=${Date.now()}`, {
        credentials: 'include',
        cache: 'no-store',
      })
      if (res.status === 403) {
        setError('forbidden')
        setData(null)
        return
      }
      if (!res.ok) {
        setError('failed')
        setData(null)
        return
      }
      const json = (await res.json()) as TeamPayload & {
        targetDisplayName?: string | null
        kpiSeries?: WeeklyTouchBucket[]
      }
      setData({
        ...json,
        kpiSeries: json.kpiSeries ?? [],
      })
    } catch {
      setError('failed')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void reload()
  }, [reload])

  const title = data?.targetDisplayName ?? userId ?? ''

  const workloadCards = useMemo(() => {
    if (!data) return null
    const w = data.workload
    return (
      <ul className="grid gap-3 sm:grid-cols-3">
        <li className="rounded-sm border border-border bg-background px-4 py-3">
          <p className="text-xs text-muted">{t('teamMember.activeOwned')}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{w.activeOwnedCount}</p>
        </li>
        <li className="rounded-sm border border-border bg-background px-4 py-3">
          <p className="text-xs text-muted">{t('teamMember.totalOwned')}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{w.totalOwnedCount}</p>
        </li>
        <li className="rounded-sm border border-border bg-background px-4 py-3">
          <p className="text-xs text-muted">{t('teamMember.activityCount')}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{data.activities.length}</p>
        </li>
      </ul>
    )
  }, [data, t])

  if (!userId) {
    return (
      <Container className="py-8">
        <p className="text-muted">{t('error.pageNotFound')}</p>
      </Container>
    )
  }

  if (loading && !data) {
    return <PageLoadingCenter framed />
  }

  if (error === 'forbidden') {
    return (
      <Container className="py-8">
        <p className="text-destructive">{t('teamMember.forbidden')}</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.push('/prospects')}>
          <ArrowLeft size={16} />
          {t('common.back')}
        </Button>
      </Container>
    )
  }

  if (error === 'failed' || !data) {
    return (
      <Container className="py-8">
        <p className="text-muted">{t('error.somethingWentWrong')}</p>
        <Button variant="secondary" className="mt-4" onClick={() => void reload()}>
          {t('team.retry')}
        </Button>
      </Container>
    )
  }

  return (
    <Container className="py-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/prospects')}>
          <ArrowLeft size={16} />
          {t('common.back')}
        </Button>
      </div>

      <header className="mb-6">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted">{t('teamMember.subtitle')}</p>
      </header>

      {workloadCards}

      <div className="mt-6 flex gap-2 border-b border-border">
        {(
          [
            ['pipeline', 'teamMember.pipeline'] as const,
            ['activity', 'teamMember.activity'] as const,
            ['kpi', 'teamMember.kpi'] as const,
          ]
        ).map(([key, labelKey]) => (
          <button
            key={key}
            type="button"
            className={cn(
              'px-4 py-2 text-sm font-medium',
              tab === key
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted hover:text-foreground',
            )}
            onClick={() => setTab(key)}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>

      <div className="mt-4 min-h-[320px]">
        {tab === 'pipeline' ? (
          data.prospects.length === 0 ? (
            <p className="text-sm text-muted">{t('teamMember.emptyProspects')}</p>
          ) : (
            <ProspectKanban
              prospects={data.prospects}
              selectedId={selectedId}
              onSelect={setSelectedId}
              enableDrag={false}
            />
          )
        ) : tab === 'kpi' ? (
          data.kpiSeries.length === 0 ? (
            <p className="text-sm text-muted">{t('common.noData')}</p>
          ) : (
            <div className="overflow-x-auto rounded-sm border border-border">
              <table className="w-full min-w-[520px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-primary/4 text-left text-xs text-muted">
                    <th className="px-3 py-2 font-medium">{t('teamMember.kpiWeek')}</th>
                    <th className="px-3 py-2 font-medium tabular-nums">{t('teamMember.kpiCalls')}</th>
                    <th className="px-3 py-2 font-medium tabular-nums">{t('teamMember.kpiEmails')}</th>
                    <th className="px-3 py-2 font-medium tabular-nums">{t('teamMember.kpiNotes')}</th>
                    <th className="px-3 py-2 font-medium tabular-nums">{t('teamMember.kpiLinkedin')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.kpiSeries.map((row) => (
                    <tr key={row.weekStart} className="border-b border-border/80">
                      <td className="px-3 py-2 tabular-nums text-muted">{row.weekStart}</td>
                      <td className="px-3 py-2 tabular-nums">{row.call}</td>
                      <td className="px-3 py-2 tabular-nums">{row.email}</td>
                      <td className="px-3 py-2 tabular-nums">{row.note}</td>
                      <td className="px-3 py-2 tabular-nums">{row.linkedin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <ul className="space-y-2">
            {data.activities.length === 0 ? (
              <li className="text-sm text-muted">{t('common.noData')}</li>
            ) : (
              data.activities.map((a) => (
                <li
                  key={a.id}
                  className="rounded-sm border border-border bg-primary/2 px-3 py-2 text-sm"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium">{a.type}</span>
                    <span className="text-xs text-muted">
                      {formatDateTime(a.createdAt, i18n.language)}
                    </span>
                  </div>
                  <Link
                    href={`/prospects/${a.prospectId}`}
                    className="mt-1 inline-block text-xs text-primary underline-offset-4 hover:underline"
                  >
                    {t('teamMember.openProspect')}
                  </Link>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </Container>
  )
}
