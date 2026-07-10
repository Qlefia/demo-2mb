'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { RefreshCw } from 'lucide-react'
import { Button, Chip, Input, Label, PageLoadingCenter, TextArea } from '@/components/atoms'
import { Modal } from '@/components/molecules/Modal'
import { cn } from '@/lib/cn'
import { PAGE_FRAME_CLASS, PAGE_SECTION_STACK } from '@/lib/layout/pageFrame'
import type { OpsProspectSummary, OpsTodaySnapshot } from '@/lib/ops/today'
import { LOST_REASONS, type LostReason } from '@/lib/db/schema/enums'
import { useAuth } from '@/providers/AuthProvider'
import { useUserStore } from '@/stores/userStore'

const OPS_HOME_ROLES = new Set(['founder', 'ops', 'admin'])

function stageI18nKey(stage: string): string {
  return stage === '1st_call' ? 'first_call' : stage
}

export function OpsTodayPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { isLoading: authLoading } = useAuth()
  const profileLoaded = useUserStore((s) => s.profileLoaded)
  const role = useUserStore((s) => s.role)

  const [data, setData] = useState<OpsTodaySnapshot | null>(null)
  const [loadError, setLoadError] = useState<'forbidden' | 'failed' | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [rejectFor, setRejectFor] = useState<OpsProspectSummary | null>(null)
  const [lostReason, setLostReason] = useState<LostReason>('other')
  const [rejectSaving, setRejectSaving] = useState(false)

  const [addTriggerOpen, setAddTriggerOpen] = useState(false)
  const [triggerProspectId, setTriggerProspectId] = useState('')
  const [triggerText, setTriggerText] = useState('')
  const [triggerSourceUrl, setTriggerSourceUrl] = useState('')
  const [triggerSaving, setTriggerSaving] = useState(false)
  const [triggerError, setTriggerError] = useState<string | null>(null)

  /** Bumped when the effect re-runs or unmounts so stale fetches skip setState. */
  const loadGenerationRef = useRef(0)

  const prospectPickList = useMemo(() => {
    if (!data) return []
    const map = new Map<string, OpsProspectSummary>()
    for (const p of [...data.triage, ...data.dossierReview]) {
      map.set(p.id, p)
    }
    return [...map.values()]
  }, [data])

  useEffect(() => {
    if (authLoading || !profileLoaded) return
    if (!role || !OPS_HOME_ROLES.has(role)) {
      router.replace('/prospects')
    }
  }, [authLoading, profileLoaded, role, router])

  const load = useCallback(
    async (mode: 'full' | 'refresh') => {
      if (!role || !OPS_HOME_ROLES.has(role)) {
        if (mode === 'full') setLoading(false)
        else setRefreshing(false)
        return
      }

      const myGen = ++loadGenerationRef.current

      if (mode === 'full') {
        setLoading(true)
        setLoadError(null)
      } else {
        setRefreshing(true)
      }
      try {
        const res = await fetch('/api/ops/today', {
          credentials: 'include',
        })
        if (myGen !== loadGenerationRef.current) return

        if (res.status === 401) {
          router.replace('/login?next=/ops/today')
          return
        }
        if (res.status === 403) {
          setLoadError('forbidden')
          setData(null)
          return
        }
        if (!res.ok) {
          setLoadError('failed')
          setData(null)
          return
        }
        const json = (await res.json()) as OpsTodaySnapshot
        setData(json)
        setLoadError(null)
      } catch {
        if (myGen !== loadGenerationRef.current) return
        setLoadError('failed')
        setData(null)
      } finally {
        if (myGen === loadGenerationRef.current) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    },
    [role, router],
  )

  useEffect(() => {
    if (authLoading || !profileLoaded) return
    if (!role || !OPS_HOME_ROLES.has(role)) return
    void load('full')
    return () => {
      loadGenerationRef.current += 1
      setLoading(false)
      setRefreshing(false)
    }
  }, [authLoading, profileLoaded, role, load])

  async function patchTriage(row: OpsProspectSummary, body: Record<string, unknown>) {
    const res = await fetch(`/api/prospects/${row.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return res.ok
  }

  const onAccept = async (row: OpsProspectSummary) => {
    const ok = await patchTriage(row, {
      stage: 'triaged',
      triageDecision: 'accept',
    })
    if (ok) void load('refresh')
  }

  const openReject = (row: OpsProspectSummary) => {
    setLostReason('other')
    setRejectFor(row)
  }

  const confirmReject = async () => {
    if (!rejectFor) return
    setRejectSaving(true)
    try {
      const ok = await patchTriage(rejectFor, {
        stage: 'lost',
        triageDecision: 'reject',
        lostReason,
      })
      if (ok) {
        setRejectFor(null)
        void load('refresh')
      }
    } finally {
      setRejectSaving(false)
    }
  }

  const submitTrigger = async () => {
    setTriggerSaving(true)
    setTriggerError(null)
    try {
      const res = await fetch('/api/triggers', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospectId: triggerProspectId,
          text: triggerText,
          sourceUrl: triggerSourceUrl.trim() ? triggerSourceUrl : undefined,
          type: 'manual',
        }),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) {
        setTriggerError(json.error ?? 'create_failed')
        return
      }
      setTriggerText('')
      setTriggerSourceUrl('')
      setAddTriggerOpen(false)
      void load('refresh')
    } catch {
      setTriggerError('network_error')
    } finally {
      setTriggerSaving(false)
    }
  }

  useEffect(() => {
    if (!addTriggerOpen || prospectPickList.length === 0) return
    if (!prospectPickList.some((p) => p.id === triggerProspectId)) {
      setTriggerProspectId(prospectPickList[0].id)
    }
  }, [addTriggerOpen, prospectPickList, triggerProspectId])

  const waitingBootstrap = authLoading || !profileLoaded
  const isOpsHome = Boolean(role && OPS_HOME_ROLES.has(role))

  if (waitingBootstrap || !isOpsHome) {
    return <PageLoadingCenter framed />
  }

  if (!data && loading) {
    return <PageLoadingCenter framed />
  }

  return (
    <div className={cn(PAGE_FRAME_CLASS, PAGE_SECTION_STACK, 'py-[var(--page-section-gap)]')}>
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link
              href="/"
              className="mb-2 inline-flex text-xs font-medium text-muted underline-offset-4 hover:text-foreground hover:underline"
            >
              {t('homeDashboard.ops.backToHome')}
            </Link>
            <h1 className="text-2xl font-semibold">{t('opsToday.title')}</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted">{t('opsToday.subtitle')}</p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setAddTriggerOpen(true)}
              disabled={prospectPickList.length === 0}
            >
              {t('opsToday.addTrigger')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="inline-flex items-center gap-2"
              onClick={() => void load('refresh')}
              disabled={refreshing || loading}
            >
              <RefreshCw
                size={16}
                className={refreshing ? 'motion-safe:animate-spin' : ''}
                aria-hidden
              />
              {t('opsToday.reload')}
            </Button>
          </div>
        </header>

        {loadError === 'forbidden' ? (
          <p className="text-sm text-destructive">{t('opsToday.errors.forbidden')}</p>
        ) : loadError === 'failed' ? (
          <p className="text-sm text-destructive">{t('opsToday.errors.loadFailed')}</p>
        ) : null}

        {data && (
          <>
            <section aria-label={t('opsToday.kpis.ariaLabel')}>
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <li className="rounded-sm border border-border bg-background px-4 py-3">
                  <p className="text-xs text-muted">{t('opsToday.kpis.dossiersReadyToday')}</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {data.kpis.dossiersReadyToday}
                  </p>
                </li>
                <li className="rounded-sm border border-border bg-background px-4 py-3">
                  <p className="text-xs text-muted">{t('opsToday.kpis.avgHoursToReady')}</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {data.kpis.avgHoursToReadyRolling != null
                      ? data.kpis.avgHoursToReadyRolling
                      : '—'}
                  </p>
                </li>
                <li className="rounded-sm border border-border bg-background px-4 py-3">
                  <p className="text-xs text-muted">{t('opsToday.kpis.optOutRate')}</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {data.kpis.optOutRatePercent != null ? `${data.kpis.optOutRatePercent}%` : '—'}
                  </p>
                </li>
                <li className="rounded-sm border border-border bg-background px-4 py-3">
                  <p className="text-xs text-muted">{t('opsToday.kpis.aiCostPlaceholder.label')}</p>
                  <p className="mt-1 text-sm text-muted">{t('opsToday.kpis.aiCostPlaceholder.body')}</p>
                </li>
              </ul>
            </section>

            <section className="rounded-sm border border-border bg-background p-4" aria-label={t('opsToday.enrichmentQuotas.title')}>
              <h2 className="text-sm font-semibold">{t('opsToday.enrichmentQuotas.title')}</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {(data.providerQuotas ?? []).map((q) => (
                  <li
                    key={q.provider}
                    className="rounded-sm border border-border bg-primary/2 px-3 py-2 text-xs"
                  >
                    <span className="text-muted">{t(`opsToday.enrichmentProviders.${q.provider}`)}: </span>
                    <span className="font-medium tabular-nums text-foreground">
                      {q.limit != null
                        ? t('opsToday.enrichmentQuotas.value', { used: q.used, limit: q.limit })
                        : t('opsToday.enrichmentQuotas.valueNoLimit', { used: q.used })}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="grid gap-[var(--page-section-gap)] lg:grid-cols-2">
              <OpsQueueSection
                title={t('opsToday.queues.triage')}
                empty={t('opsToday.queues.triageEmpty')}
                rows={data.triage}
                mode="triage"
                stageI18nKey={stageI18nKey}
                onAccept={onAccept}
                onReject={openReject}
              />
              <OpsQueueSection
                title={t('opsToday.queues.dossierReview')}
                empty={t('opsToday.queues.dossierEmpty')}
                rows={data.dossierReview}
                mode="review"
                stageI18nKey={stageI18nKey}
              />
            </div>
          </>
        )}

      <Modal
        open={rejectFor !== null}
        onClose={() => !rejectSaving && setRejectFor(null)}
        title={t('opsToday.triage.rejectTitle')}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setRejectFor(null)}>
              {t('common.cancel')}
            </Button>
            <Button type="button" onClick={() => void confirmReject()} disabled={rejectSaving}>
              {rejectSaving ? t('common.saving') : t('common.confirm')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">{rejectFor?.accountName}</p>
        <Label className="mt-4">{t('opsToday.triage.lostReasonLabel')}</Label>
        <select
          className="mt-1 block w-full rounded-sm border border-border bg-background px-3 py-2 text-sm outline-none ring-focus focus-visible:ring-2"
          value={lostReason}
          onChange={(e) => setLostReason(e.target.value as LostReason)}
        >
          {LOST_REASONS.map((r) => (
            <option key={r} value={r}>
              {t(`opsToday.lostReasons.${r}`)}
            </option>
          ))}
        </select>
      </Modal>

      <Modal
        open={addTriggerOpen}
        onClose={() => {
          setTriggerError(null)
          setAddTriggerOpen(false)
        }}
        title={t('opsToday.addTriggerModal.title')}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setTriggerError(null)
                setAddTriggerOpen(false)
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              onClick={() => void submitTrigger()}
              disabled={
                triggerSaving ||
                triggerText.trim().length < 1 ||
                !triggerProspectId ||
                prospectPickList.length === 0
              }
            >
              {triggerSaving ? t('common.saving') : t('common.submit')}
            </Button>
          </>
        }
      >
        {triggerError ? (
          <p className="mb-3 text-sm text-destructive">
            {t(`opsToday.addTriggerModal.errors.${triggerError}`, { defaultValue: triggerError })}
          </p>
        ) : null}
        <Label>{t('opsToday.addTriggerModal.prospectLabel')}</Label>
        <select
          className="mt-1 block w-full rounded-sm border border-border bg-background px-3 py-2 text-sm outline-none ring-focus focus-visible:ring-2"
          value={triggerProspectId}
          onChange={(e) => setTriggerProspectId(e.target.value)}
        >
          {prospectPickList.map((p) => (
            <option key={p.id} value={p.id}>
              {p.accountName} ({p.territory})
            </option>
          ))}
        </select>

        <Label className="mt-4">{t('opsToday.addTriggerModal.textLabel')}</Label>
        <TextArea className="mt-1 min-h-[100px]" value={triggerText} onChange={(e) => setTriggerText(e.target.value)} />

        <Label className="mt-4">{t('opsToday.addTriggerModal.sourceUrlLabel')}</Label>
        <Input
          type="url"
          className="mt-1"
          value={triggerSourceUrl}
          onChange={(e) => setTriggerSourceUrl(e.target.value)}
          placeholder={t('opsToday.addTriggerModal.sourceUrlPlaceholder')}
        />
      </Modal>
    </div>
  )
}

interface OpsQueueSectionProps {
  title: string
  empty: string
  rows: OpsProspectSummary[]
  mode: 'triage' | 'review'
  stageI18nKey: (s: string) => string
  onAccept?: (row: OpsProspectSummary) => void
  onReject?: (row: OpsProspectSummary) => void
}

function OpsQueueSection({
  title,
  empty,
  rows,
  mode,
  stageI18nKey,
  onAccept,
  onReject,
}: OpsQueueSectionProps) {
  const { t } = useTranslation()
  return (
    <section className="min-w-0">
      <h2 className="text-base font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className="rounded-sm border border-border bg-background p-3 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/prospects/${row.id}`}
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {row.accountName}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Chip variant="default" size="sm">
                      {row.territory}
                    </Chip>
                    <span className="text-xs text-muted">
                      {t(`prospects.stages.${stageI18nKey(row.stage)}`)}
                      {row.dossierStatus
                        ? ` · ${t(`opsToday.dossierStatus.${row.dossierStatus}`)}`
                        : ''}
                    </span>
                  </div>
                  {row.triggerPreview ? (
                    <p className="mt-2 line-clamp-2 text-xs text-muted">{row.triggerPreview}</p>
                  ) : null}
                </div>
                {mode === 'triage' && onAccept && onReject ? (
                  <div className="flex shrink-0 gap-2">
                    <Button type="button" size="sm" onClick={() => void onAccept(row)}>
                      {t('opsToday.triage.accept')}
                    </Button>
                    <Button type="button" size="sm" variant="secondary" onClick={() => onReject(row)}>
                      {t('opsToday.triage.reject')}
                    </Button>
                  </div>
                ) : (
                  <Link
                    href={`/prospects/${row.id}`}
                    className={cn(
                      'survey-brand-button inline-flex h-8 items-center justify-center rounded-sm border border-border px-3 text-xs font-medium transition-colors hover:bg-hover',
                    )}
                  >
                    {t('opsToday.openProspect')}
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
