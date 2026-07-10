'use client'

import Link from 'next/link'
import type { Dispatch, SetStateAction } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input/Input'
import { Label } from '@/components/atoms/Label/Label'
import { TextArea } from '@/components/atoms/TextArea/TextArea'

type ServiceDraft = { title: string; description: string; sortOrder: number }
type SegmentDraft = { title: string; priority: number; notes: string }
type MatrixDraft = { serviceIndex: number; segmentIndex: number; pitch: string }

type OnboardingPayload = {
  workspaceId: string
  state: { workspaceId: string; status: string } | undefined
  services: { id: string; title: string; description: string | null; sortOrder: number }[]
  segments: { id: string; title: string; priority: number; notes: string | null }[]
  matrix: { workspaceId: string; serviceId: string; segmentId: string; pitch: string | null }[]
}

type FetchState = 'loading' | 'ready' | 'error' | 'unauth'

function applyPayloadToDrafts(
  data: OnboardingPayload,
  setServices: Dispatch<SetStateAction<ServiceDraft[]>>,
  setSegments: Dispatch<SetStateAction<SegmentDraft[]>>,
  setMatrix: Dispatch<SetStateAction<MatrixDraft[]>>,
) {
  const svcList = Array.isArray(data.services) ? data.services : []
  const segList = Array.isArray(data.segments) ? data.segments : []
  const matrixList = Array.isArray(data.matrix) ? data.matrix : []

  if (svcList.length > 0) {
    setServices(
      svcList.map((s) => ({
        title: s.title,
        description: s.description ?? '',
        sortOrder: s.sortOrder,
      })),
    )
  } else {
    setServices([{ title: '', description: '', sortOrder: 0 }])
  }
  if (segList.length > 0) {
    setSegments(
      segList.map((s) => ({
        title: s.title,
        priority: s.priority,
        notes: s.notes ?? '',
      })),
    )
  } else {
    setSegments([{ title: '', priority: 0, notes: '' }])
  }
  const rebuiltMatrix: MatrixDraft[] = []
  for (const row of matrixList) {
    const si = svcList.findIndex((x) => x.id === row.serviceId)
    const ti = segList.findIndex((x) => x.id === row.segmentId)
    if (si >= 0 && ti >= 0) {
      rebuiltMatrix.push({ serviceIndex: si, segmentIndex: ti, pitch: row.pitch ?? '' })
    }
  }
  setMatrix(rebuiltMatrix)
}

export function WorkspaceOnboardingPageClient() {
  const { t } = useTranslation()

  const [step, setStep] = useState(0)
  const [fetchState, setFetchState] = useState<FetchState>('loading')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [services, setServices] = useState<ServiceDraft[]>([{ title: '', description: '', sortOrder: 0 }])
  const [segments, setSegments] = useState<SegmentDraft[]>([{ title: '', priority: 0, notes: '' }])
  const [matrix, setMatrix] = useState<MatrixDraft[]>([])

  const loadData = useCallback(async () => {
    setFetchState('loading')
    setError(null)
    try {
      const res = await fetch('/api/workspace/onboarding', {
        credentials: 'include',
        cache: 'no-store',
      })
      if (res.status === 401) {
        setFetchState('unauth')
        return
      }
      if (!res.ok) {
        setFetchState('error')
        return
      }
      const data = (await res.json()) as OnboardingPayload
      applyPayloadToDrafts(data, setServices, setSegments, setMatrix)
      setFetchState('ready')
    } catch {
      setFetchState('error')
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const persist = async (status: 'draft' | 'in_review' | 'confirmed') => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/workspace/onboarding', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          services: services.filter((s) => s.title.trim().length > 0),
          segments: segments.filter((s) => s.title.trim().length > 0),
          matrix: matrix.filter(
            (m) =>
              services[m.serviceIndex]?.title.trim().length > 0 &&
              segments[m.segmentIndex]?.title.trim().length > 0,
          ),
        }),
      })
      if (res.status === 401) {
        setFetchState('unauth')
        setError(t('workspaceOnboarding.unauthenticated'))
        return
      }
      if (!res.ok) {
        setError(t('workspaceOnboarding.saveError'))
        return
      }
      await loadData()
    } catch {
      setError(t('workspaceOnboarding.saveError'))
    } finally {
      setSaving(false)
    }
  }

  if (fetchState === 'loading') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-muted">
        {t('workspaceOnboarding.loading')}
      </div>
    )
  }

  if (fetchState === 'unauth') {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 py-16 text-center">
        <h1 className="text-lg font-semibold">{t('workspaceOnboarding.unauthenticatedTitle')}</h1>
        <p className="text-sm text-muted">{t('workspaceOnboarding.unauthenticated')}</p>
        <Link
          href="/login?redirect=%2Fonboarding"
          className="inline-flex h-10 items-center justify-center rounded-sm bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t('workspaceOnboarding.signInAgain')}
        </Link>
      </div>
    )
  }

  if (fetchState === 'error') {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 py-16 text-center">
        <h1 className="text-lg font-semibold">{t('workspaceOnboarding.loadErrorTitle')}</h1>
        <p className="text-sm text-muted">{t('workspaceOnboarding.loadError')}</p>
        <p className="text-sm text-muted">{t('workspaceOnboarding.loadErrorHint')}</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button type="button" onClick={() => void loadData()}>
            {t('workspaceOnboarding.retry')}
          </Button>
          <Link
            href="/settings"
            className="inline-flex h-10 items-center justify-center rounded-sm border border-border px-4 text-sm font-medium text-foreground hover:bg-hover"
          >
            {t('workspaceOnboarding.openSettings')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">{t('workspaceOnboarding.title')}</h1>
        <p className="text-sm text-muted">{t('workspaceOnboarding.subtitle')}</p>
      </header>

      <nav className="flex gap-2 text-xs font-medium uppercase tracking-wide text-muted">
        {[0, 1, 2, 3].map((i) => (
          <button
            key={i}
            type="button"
            className={i === step ? 'text-foreground' : 'hover:text-foreground'}
            onClick={() => setStep(i)}
          >
            {t(`workspaceOnboarding.step${i}Label`)}
          </button>
        ))}
      </nav>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {step === 0 && (
        <section className="space-y-4">
          <p className="text-sm text-muted">{t('workspaceOnboarding.servicesHint')}</p>
          {services.map((s, i) => (
            <div key={i} className="space-y-2 rounded-md border border-border p-4">
              <div className="space-y-1.5">
                <Label htmlFor={`svc-title-${i}`}>{t('workspaceOnboarding.serviceTitle')}</Label>
                <Input
                  id={`svc-title-${i}`}
                  value={s.title}
                  onChange={(e) => {
                    const next = [...services]
                    next[i] = { ...next[i], title: e.target.value }
                    setServices(next)
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`svc-desc-${i}`}>{t('workspaceOnboarding.serviceDescription')}</Label>
                <TextArea
                  id={`svc-desc-${i}`}
                  value={s.description}
                  onChange={(e) => {
                    const next = [...services]
                    next[i] = { ...next[i], description: e.target.value }
                    setServices(next)
                  }}
                  rows={3}
                />
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            onClick={() => setServices([...services, { title: '', description: '', sortOrder: services.length }])}
          >
            {t('workspaceOnboarding.addService')}
          </Button>
        </section>
      )}

      {step === 1 && (
        <section className="space-y-4">
          <p className="text-sm text-muted">{t('workspaceOnboarding.segmentsHint')}</p>
          {segments.map((s, i) => (
            <div key={i} className="space-y-2 rounded-md border border-border p-4">
              <div className="space-y-1.5">
                <Label htmlFor={`seg-title-${i}`}>{t('workspaceOnboarding.segmentTitle')}</Label>
                <Input
                  id={`seg-title-${i}`}
                  value={s.title}
                  onChange={(e) => {
                    const next = [...segments]
                    next[i] = { ...next[i], title: e.target.value }
                    setSegments(next)
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`seg-prio-${i}`}>{t('workspaceOnboarding.segmentPriority')}</Label>
                <Input
                  id={`seg-prio-${i}`}
                  type="number"
                  value={String(s.priority)}
                  onChange={(e) => {
                    const next = [...segments]
                    next[i] = { ...next[i], priority: Number(e.target.value) || 0 }
                    setSegments(next)
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`seg-notes-${i}`}>{t('workspaceOnboarding.segmentNotes')}</Label>
                <TextArea
                  id={`seg-notes-${i}`}
                  value={s.notes}
                  onChange={(e) => {
                    const next = [...segments]
                    next[i] = { ...next[i], notes: e.target.value }
                    setSegments(next)
                  }}
                  rows={2}
                />
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setSegments([...segments, { title: '', priority: segments.length, notes: '' }])
            }
          >
            {t('workspaceOnboarding.addSegment')}
          </Button>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4">
          <p className="text-sm text-muted">{t('workspaceOnboarding.matrixHint')}</p>
          {matrix.map((m, i) => (
            <div key={i} className="grid gap-2 rounded-md border border-border p-4 md:grid-cols-3">
              <label className="text-xs font-medium text-muted">
                {t('workspaceOnboarding.matrixService')}
                <select
                  className="mt-1 w-full rounded-sm border border-border bg-background px-2 py-1.5 text-sm"
                  value={m.serviceIndex}
                  onChange={(e) => {
                    const next = [...matrix]
                    next[i] = { ...next[i], serviceIndex: Number(e.target.value) }
                    setMatrix(next)
                  }}
                >
                  {services.map((s, idx) => (
                    <option key={idx} value={idx} disabled={!s.title.trim()}>
                      {s.title || t('workspaceOnboarding.unnamedService')}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-medium text-muted">
                {t('workspaceOnboarding.matrixSegment')}
                <select
                  className="mt-1 w-full rounded-sm border border-border bg-background px-2 py-1.5 text-sm"
                  value={m.segmentIndex}
                  onChange={(e) => {
                    const next = [...matrix]
                    next[i] = { ...next[i], segmentIndex: Number(e.target.value) }
                    setMatrix(next)
                  }}
                >
                  {segments.map((s, idx) => (
                    <option key={idx} value={idx} disabled={!s.title.trim()}>
                      {s.title || t('workspaceOnboarding.unnamedSegment')}
                    </option>
                  ))}
                </select>
              </label>
              <div className="md:col-span-1">
                <Label className="text-xs text-muted">{t('workspaceOnboarding.matrixPitch')}</Label>
                <TextArea
                  className="mt-1"
                  value={m.pitch}
                  onChange={(e) => {
                    const next = [...matrix]
                    next[i] = { ...next[i], pitch: e.target.value }
                    setMatrix(next)
                  }}
                  rows={2}
                />
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setMatrix([
                ...matrix,
                { serviceIndex: 0, segmentIndex: 0, pitch: '' },
              ])
            }
          >
            {t('workspaceOnboarding.addMatrixRow')}
          </Button>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-3 text-sm">
          <p>{t('workspaceOnboarding.reviewIntro')}</p>
          <ul className="list-disc space-y-1 pl-5 text-muted">
            <li>
              {t('workspaceOnboarding.reviewServices', { count: services.filter((s) => s.title.trim()).length })}
            </li>
            <li>
              {t('workspaceOnboarding.reviewSegments', {
                count: segments.filter((s) => s.title.trim()).length,
              })}
            </li>
            <li>{t('workspaceOnboarding.reviewMatrix', { count: matrix.length })}</li>
          </ul>
        </section>
      )}

      <footer className="flex flex-wrap gap-2 border-t border-border pt-6">
        <Button type="button" variant="secondary" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
          {t('workspaceOnboarding.back')}
        </Button>
        {step < 3 ? (
          <Button type="button" onClick={() => setStep((s) => Math.min(3, s + 1))}>
            {t('workspaceOnboarding.next')}
          </Button>
        ) : null}
        <Button type="button" variant="secondary" disabled={saving} onClick={() => void persist('draft')}>
          {t('workspaceOnboarding.saveDraft')}
        </Button>
        <Button type="button" variant="secondary" disabled={saving} onClick={() => void persist('in_review')}>
          {t('workspaceOnboarding.submitReview')}
        </Button>
        <Button type="button" disabled={saving} onClick={() => void persist('confirmed')}>
          {t('workspaceOnboarding.confirm')}
        </Button>
      </footer>
    </div>
  )
}
