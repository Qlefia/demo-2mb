'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import {
  ArrowRight,
  CalendarDays,
  CheckSquare,
  ChevronRight,
  Radar,
  Video,
} from 'lucide-react'
import { Button, PageLoadingCenter } from '@/components/atoms'
import { EmptyState } from '@/components/molecules'
import { DashboardFavorites } from '@/features/dashboard/components/DashboardFavorites'
import { GetSignalsModal } from '@/features/dashboard/components/GetSignalsModal'
import { cn } from '@/lib/cn'
import { formatDateTime, formatTime } from '@/lib/intl/datetime'
import { PAGE_FRAME_CLASS, PAGE_SECTION_STACK } from '@/lib/layout/pageFrame'
import { useDashboardHome } from '@/features/dashboard/lib/useDashboardHome'
import { useDashboardHomeRealtime } from '@/features/dashboard/lib/useDashboardHomeRealtime'
import type { DashboardPeriod } from '@/features/dashboard/lib/dashboardApi'
import { STAGE_META } from '@/features/prospects/stageMeta'
import {
  studioRadiusBlock,
  studioTintPanel,
} from '@/features/studio-settings/studioBlockChrome'
import { MeetingDetailSheet } from '@/features/meetings/MeetingDetailSheet'
import { refetchMeetingSurfaces } from '@/features/meetings/api/meetingsQueryKeys'
import type { CalendarMeetingDTO } from '@/lib/meetings/schema'
import type { OpsProspectSummary } from '@/lib/ops/today'
import { useAuth } from '@/providers/AuthProvider'
import { useUserStore } from '@/stores/userStore'
import { prospectsListUrl } from '@/lib/prospects/prospectsUrl'

const OPS_ROLES = new Set(['founder', 'ops', 'admin'])
const SALES_ROLES = new Set(['sales_de', 'sales_uk'])

const AGENDA_ROW =
  'group -mx-1 flex w-full items-center gap-3 rounded-sm px-1 py-2.5 text-left transition-colors hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

function stageI18nKey(stage: string): string {
  return stage === '1st_call' ? 'first_call' : stage
}

function isJoinUrl(location: string | null | undefined): location is string {
  return Boolean(location?.trim().startsWith('http'))
}

const DASHBOARD_AGENDA_MEETINGS_ID = 'dashboard-agenda-meetings'
const DASHBOARD_AGENDA_TASKS_ID = 'dashboard-agenda-tasks'

const AGENDA_ANCHOR_CLASS = 'scroll-mt-[calc(var(--page-section-gap)+3.5rem)]'

function StatTile({
  label,
  value,
  hint,
  href,
}: {
  label: string
  value: string | number
  hint?: string
  href?: string
}) {
  const body = (
    <>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-xl font-semibold tabular-nums tracking-tight text-foreground max-lg:text-lg">{value}</p>
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </>
  )

  const className = cn(
    studioTintPanel,
    'flex min-w-0 flex-col gap-0.5 max-lg:gap-0 max-lg:py-2 max-lg:px-3',
    href &&
      'transition-colors hover:border-foreground/20 hover:bg-foreground/[0.03] dark:hover:bg-white/[0.04]',
  )

  if (!href) {
    return <div className={className}>{body}</div>
  }

  if (href.startsWith('#')) {
    return (
      <a href={href} className={cn(className, 'no-underline')}>
        {body}
      </a>
    )
  }

  return (
    <Link href={href} className={cn(className, 'no-underline')}>
      {body}
    </Link>
  )
}

function OpsQueuePreview({
  title,
  count,
  emptyLabel,
  items,
  href,
}: {
  title: string
  count: number
  emptyLabel: string
  items: OpsProspectSummary[]
  href: string
}) {
  const { t } = useTranslation()

  return (
    <section className={cn(studioTintPanel, 'flex flex-col gap-3')}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <p className="mt-0.5 text-xs text-muted">{t('homeDashboard.ops.waiting', { count })}</p>
        </div>
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-foreground underline-offset-4 hover:underline"
        >
          {t('homeDashboard.ops.openQueue')}
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted">{emptyLabel}</p>
      ) : (
        <ul className="divide-y divide-border/60">
          {items.map((row) => (
            <li key={row.id}>
              <Link
                href={`/prospects/${row.id}`}
                className={AGENDA_ROW}
              >
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{row.accountName}</span>
                <span className="shrink-0 text-xs text-muted">
                  {t(`prospects.stages.${stageI18nKey(row.stage)}`)}
                </span>
                <ChevronRight
                  className="size-4 shrink-0 text-muted opacity-60 transition-opacity group-hover:opacity-100"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function UpcomingMeetingRow({
  meeting,
  locale,
  onSelect,
}: {
  meeting: CalendarMeetingDTO
  locale: string
  onSelect: (meeting: CalendarMeetingDTO) => void
}) {
  const { t } = useTranslation()
  const hasJoin = isJoinUrl(meeting.location)

  return (
    <li>
      <button
        type="button"
        className={AGENDA_ROW}
        onClick={() => onSelect(meeting)}
        aria-label={t('homeDashboard.agenda.openMeeting', { title: meeting.title })}
      >
        <div className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{meeting.title}</span>
          <span className="mt-0.5 block text-xs text-muted">
            {formatTime(meeting.startsAt, locale)} · {meeting.prospectAccountName}
          </span>
          <span className="mt-0.5 block text-xs text-muted">
            {formatDateTime(meeting.startsAt, locale, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
        {hasJoin ? (
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-sm bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent"
            title={t('calendar.sheet.actions.join')}
          >
            <Video className="size-3" aria-hidden />
            {t('calendar.sheet.actions.joinShort')}
          </span>
        ) : null}
        <ChevronRight
          className="size-4 shrink-0 text-muted opacity-60 transition-opacity group-hover:opacity-100"
          aria-hidden
        />
      </button>
    </li>
  )
}

export function HomeDashboard() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const { user, isLoading: authLoading } = useAuth()
  const displayName = useUserStore((s) => s.user.displayName)
  const role = useUserStore((s) => s.role)
  const profileLoaded = useUserStore((s) => s.profileLoaded)

  const [period, setPeriod] = useState<DashboardPeriod>('week')
  const [selectedMeeting, setSelectedMeeting] = useState<CalendarMeetingDTO | null>(null)
  const [signalsOpen, setSignalsOpen] = useState(false)
  const [signalsPresetProspectId, setSignalsPresetProspectId] = useState<string | null>(null)
  const { data, isLoading, isError, refetch } = useDashboardHome(period)

  useDashboardHomeRealtime({
    active: profileLoaded && !authLoading && Boolean(user),
    userId: user?.id,
    role,
  })

  const isOps = Boolean(role && OPS_ROLES.has(role))
  const isSales = Boolean(role && SALES_ROLES.has(role))

  const pipelineStages = useMemo(() => {
    if (!data) return []
    return STAGE_META.filter((meta) => {
      const count = data.ownedActiveStages[meta.id] ?? 0
      return count > 0 && meta.id !== 'won' && meta.id !== 'lost'
    }).map((meta) => ({
      ...meta,
      count: data.ownedActiveStages[meta.id] ?? 0,
    }))
  }, [data])

  const greetingName = displayName.trim() || t('homeDashboard.greetingFallback')

  if (!profileLoaded || isLoading) {
    return <PageLoadingCenter framed />
  }

  return (
    <div className="flex flex-col">
      <header
        className={cn(
          PAGE_FRAME_CLASS,
          'shrink-0 pt-[var(--page-section-gap)] pb-[var(--page-section-gap)]',
        )}
      >
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t('homeDashboard.greeting', { name: greetingName })}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted">
            {isOps ? t('homeDashboard.subtitleOps') : t('homeDashboard.subtitle')}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button type="button" onClick={() => setSignalsOpen(true)}>
            <Radar className="size-4" aria-hidden />
            {t('homeDashboard.signals.getSignals')}
          </Button>
          {isOps ? (
            <Link
              href="/ops/today"
              className="inline-flex items-center gap-1 text-sm font-medium text-muted underline-offset-4 hover:text-foreground hover:underline"
            >
              {t('homeDashboard.ops.fullView')}
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          ) : null}
        </div>
      </header>

      <main className={cn(PAGE_FRAME_CLASS, PAGE_SECTION_STACK)}>
        {isError ? (
          <div className="rounded-sm border border-border bg-background px-4 py-3">
            <p className="text-sm font-medium text-foreground">{t('homeDashboard.errors.loadFailed')}</p>
            <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={() => void refetch()}>
              {t('common.retry')}
            </Button>
          </div>
        ) : null}

        {data ? (
          <div
            className="grid gap-[var(--page-section-gap)] sm:grid-cols-2 lg:grid-cols-4 lg:items-start"
            aria-label={t('homeDashboard.metricsAria')}
          >
            {isSales || !isOps ? (
              <>
                <StatTile
                  label={t('homeDashboard.metrics.activePipeline')}
                  value={data.workload.activeOwnedCount}
                  href={prospectsListUrl()}
                />
                <StatTile
                  label={t('homeDashboard.metrics.assigned')}
                  value={data.workload.totalOwnedCount}
                  href={prospectsListUrl()}
                />
              </>
            ) : null}
            {isOps && data.opsPreview ? (
              <>
                <StatTile
                  label={t('homeDashboard.metrics.triageQueue')}
                  value={data.opsPreview.triageCount}
                  href={prospectsListUrl({ stage: 'new' })}
                />
                <StatTile
                  label={t('homeDashboard.metrics.dossierReview')}
                  value={data.opsPreview.dossierReviewCount}
                  href="/ops/today"
                />
                <StatTile
                  label={t('homeDashboard.metrics.dossiersToday')}
                  value={data.opsPreview.kpis.dossiersReadyToday}
                  href={prospectsListUrl({ stage: 'dossier_ready' })}
                />
                <StatTile
                  label={t('homeDashboard.metrics.avgHoursReady')}
                  value={
                    data.opsPreview.kpis.avgHoursToReadyRolling != null
                      ? data.opsPreview.kpis.avgHoursToReadyRolling
                      : '—'
                  }
                />
              </>
            ) : (
              <StatTile
                label={t('homeDashboard.metrics.touchesWeek')}
                value={data.touchesLast7Days}
              />
            )}
            {!isOps ? (
              <StatTile
                label={t('homeDashboard.metrics.upcomingMeetings')}
                value={data.upcomingMeetings.length}
                href={`#${DASHBOARD_AGENDA_MEETINGS_ID}`}
              />
            ) : null}
            {!isOps ? (
              <StatTile
                label={t('homeDashboard.metrics.openTasks')}
                value={data.openTasks.length}
                href={`#${DASHBOARD_AGENDA_TASKS_ID}`}
              />
            ) : null}

            <div className={cn('min-w-0 max-lg:order-2 max-lg:col-span-full lg:col-span-3', PAGE_SECTION_STACK)}>
                {isOps && data.opsPreview ? (
                  <div className="grid gap-[var(--page-section-gap)] md:grid-cols-2">
                    <OpsQueuePreview
                      title={t('opsToday.queues.triage')}
                      count={data.opsPreview.triageCount}
                      emptyLabel={t('opsToday.queues.triageEmpty')}
                      items={data.opsPreview.triagePreview}
                      href="/ops/today"
                    />
                    <OpsQueuePreview
                      title={t('opsToday.queues.dossierReview')}
                      count={data.opsPreview.dossierReviewCount}
                      emptyLabel={t('opsToday.queues.dossierEmpty')}
                      items={data.opsPreview.dossierPreview}
                      href="/ops/today"
                    />
                  </div>
                ) : null}

                {(isSales || !isOps) && pipelineStages.length > 0 ? (
                  <section className={cn(studioTintPanel, 'flex flex-col gap-3')}>
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-sm font-semibold">{t('homeDashboard.pipeline.title')}</h2>
                      <Link
                        href="/prospects"
                        className="text-xs font-medium text-foreground underline-offset-4 hover:underline"
                      >
                        {t('homeDashboard.pipeline.viewAll')}
                      </Link>
                    </div>
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {pipelineStages.map((stage) => (
                        <li key={stage.id}>
                          <Link
                            href={prospectsListUrl({ stage: stage.id })}
                            className={cn(
                              studioRadiusBlock,
                              'flex items-center gap-3 bg-background/60 px-3 py-2.5 transition-colors hover:bg-foreground/[0.04] dark:bg-background/40 dark:hover:bg-white/[0.06]',
                            )}
                          >
                            <span
                              className={cn('size-2 shrink-0 rounded-full', stage.accentClass)}
                              aria-hidden
                            />
                            <span className="min-w-0 flex-1 truncate text-sm">
                              {t(stage.labelKey)}
                            </span>
                            <span className="shrink-0 text-sm font-semibold tabular-nums">
                              {stage.count}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {isOps || isSales ? (
                  <section className={cn(studioTintPanel, 'flex flex-col gap-[var(--page-section-gap)]')}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="text-sm font-semibold">{t('homeDashboard.workspaceKpis')}</h2>
                      <div className="flex gap-1.5">
                        {(['week', 'month'] as const).map((p) => (
                          <button
                            key={p}
                            type="button"
                            className={cn(
                              studioRadiusBlock,
                              'px-2.5 py-1 text-xs font-medium transition-colors',
                              period === p
                                ? 'bg-foreground text-background'
                                : 'bg-foreground/6 text-muted hover:text-foreground dark:bg-white/8',
                            )}
                            onClick={() => setPeriod(p)}
                          >
                            {t(p === 'week' ? 'dashboardSales.periodWeek' : 'dashboardSales.periodMonth')}
                          </button>
                        ))}
                      </div>
                    </div>
                    <ul className="grid gap-[var(--page-section-gap)] sm:grid-cols-2 lg:grid-cols-3">
                      <StatTile
                        label={t('dashboardSales.kpiNewProspects')}
                        value={data.periodKpis.newProspects}
                        href={prospectsListUrl({ stage: 'new' })}
                      />
                      <StatTile
                        label={t('dashboardSales.kpiDossierReady')}
                        value={data.periodKpis.transitionsToDossierReady}
                        href={prospectsListUrl({ stage: 'dossier_ready' })}
                      />
                      <StatTile
                        label={t('dashboardSales.kpiWon')}
                        value={data.periodKpis.wonCount}
                        href={prospectsListUrl({ stage: 'won' })}
                      />
                      <StatTile
                        label={t('dashboardSales.kpiLost')}
                        value={data.periodKpis.lostCount}
                        href={prospectsListUrl({ stage: 'lost' })}
                      />
                      <StatTile
                        label={t('dashboardSales.kpiAvgHoursReady')}
                        value={
                          data.periodKpis.avgHoursToReady != null
                            ? data.periodKpis.avgHoursToReady
                            : '—'
                        }
                      />
                    </ul>
                  </section>
                ) : null}

                <DashboardFavorites
                  items={data.favoriteProspects ?? []}
                  onScanSignals={(prospectId) => {
                    setSignalsPresetProspectId(prospectId)
                    setSignalsOpen(true)
                  }}
                />
              </div>

              <aside className={cn('min-w-0 max-lg:order-1 max-lg:col-span-full lg:col-span-1', PAGE_SECTION_STACK)}>
                <section
                  id={DASHBOARD_AGENDA_MEETINGS_ID}
                  className={cn(studioTintPanel, AGENDA_ANCHOR_CLASS, 'flex flex-col gap-3')}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h2 className="text-sm font-semibold">{t('homeDashboard.agenda.meetings')}</h2>
                      <p className="mt-0.5 text-xs text-muted">{t('homeDashboard.agenda.meetingsHint')}</p>
                    </div>
                    <Link
                      href="/calendar"
                      className="shrink-0 text-xs font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      {t('meetings.viewAll')}
                    </Link>
                  </div>
                  {data.upcomingMeetings.length === 0 ? (
                    <EmptyState
                      icon={CalendarDays}
                      title={t('meetings.emptyShort')}
                      description={t('homeDashboard.agenda.meetingsEmptyHint')}
                      action={
                        <Link
                          href="/calendar"
                          className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
                        >
                          {t('calendar.title')}
                        </Link>
                      }
                    />
                  ) : (
                    <ul className="divide-y divide-border/60">
                      {data.upcomingMeetings.map((m) => (
                        <UpcomingMeetingRow
                          key={m.id}
                          meeting={m}
                          locale={i18n.language}
                          onSelect={setSelectedMeeting}
                        />
                      ))}
                    </ul>
                  )}
                </section>

                <section
                  id={DASHBOARD_AGENDA_TASKS_ID}
                  className={cn(studioTintPanel, AGENDA_ANCHOR_CLASS, 'flex flex-col gap-3')}
                >
                  <div className="flex items-center gap-2">
                    <CheckSquare className="size-4 text-muted" aria-hidden />
                    <h2 className="text-sm font-semibold">{t('homeDashboard.agenda.tasks')}</h2>
                  </div>
                  {data.openTasks.length === 0 ? (
                    <p className="text-sm text-muted">{t('homeDashboard.agenda.tasksEmpty')}</p>
                  ) : (
                    <ul className="divide-y divide-border/60">
                      {data.openTasks.map((task) => {
                        const overdue =
                          task.dueAt != null && new Date(task.dueAt).getTime() < Date.now()
                        const inner = (
                          <>
                            <div className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">{task.title}</span>
                              {task.accountName ? (
                                <span className="mt-0.5 block truncate text-xs text-muted">
                                  {task.accountName}
                                </span>
                              ) : null}
                              {task.dueAt ? (
                                <span
                                  className={cn(
                                    'mt-0.5 block text-xs',
                                    overdue ? 'font-medium text-destructive' : 'text-muted',
                                  )}
                                >
                                  {overdue
                                    ? t('homeDashboard.agenda.overdue')
                                    : t('homeDashboard.agenda.due')}{' '}
                                  {formatDateTime(task.dueAt, i18n.language, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              ) : null}
                            </div>
                            <ChevronRight
                              className="size-4 shrink-0 text-muted opacity-60 transition-opacity group-hover:opacity-100"
                              aria-hidden
                            />
                          </>
                        )

                        return (
                          <li key={task.id}>
                            {task.prospectId ? (
                              <Link href={`/prospects/${task.prospectId}`} className={cn(AGENDA_ROW, 'px-1')}>
                                {inner}
                              </Link>
                            ) : (
                              <div className={cn(AGENDA_ROW, 'px-1 cursor-default')}>{inner}</div>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </section>
              </aside>
          </div>
        ) : null}
      </main>

      {selectedMeeting ? (
        <MeetingDetailSheet
          meeting={selectedMeeting}
          locale={i18n.language}
          onClose={() => setSelectedMeeting(null)}
          onUpdated={(updated) => {
            void refetchMeetingSurfaces(queryClient, updated.prospectId)
            setSelectedMeeting((prev) =>
              prev?.id === updated.id
                ? {
                    ...prev,
                    ...updated,
                    prospectAccountName: prev.prospectAccountName,
                    prospectStage: prev.prospectStage,
                    assigneeDisplayName: prev.assigneeDisplayName,
                  }
                : prev,
            )
          }}
          onDeleted={() => {
            void refetchMeetingSurfaces(queryClient, selectedMeeting.prospectId)
            setSelectedMeeting(null)
          }}
          onRestored={(restored) => {
            void refetchMeetingSurfaces(queryClient, restored.prospectId)
            setSelectedMeeting((prev) =>
              prev?.id === restored.id
                ? {
                    ...prev,
                    ...restored,
                    prospectAccountName: prev.prospectAccountName,
                    prospectStage: prev.prospectStage,
                    assigneeDisplayName: prev.assigneeDisplayName,
                  }
                : prev,
            )
          }}
        />
      ) : null}

      <GetSignalsModal
        open={signalsOpen}
        presetProspectId={signalsPresetProspectId}
        onClose={() => {
          setSignalsOpen(false)
          setSignalsPresetProspectId(null)
        }}
      />
    </div>
  )
}
