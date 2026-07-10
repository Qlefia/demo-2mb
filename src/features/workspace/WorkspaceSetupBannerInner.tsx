'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/providers/AuthProvider'
import { Button } from '@/components/atoms/Button/Button'
import { Alert } from '@/components/molecules'
import { PAGE_FRAME_CLASS } from '@/lib/layout/pageFrame'
import { cn } from '@/lib/cn'

type OnboardingStatus = 'draft' | 'in_review' | 'confirmed'

type GateState = 'idle' | 'loading' | 'incomplete' | 'complete' | 'error'

export function WorkspaceSetupBannerInner() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [gate, setGate] = useState<GateState>('idle')
  const [dismissed, setDismissed] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    if (!user) {
      setGate('idle')
      return
    }
    let cancelled = false
    setGate('loading')
    void (async () => {
      try {
        const res = await fetch('/api/workspace/onboarding', { credentials: 'include' })
        if (cancelled) return
        if (!res.ok) {
          setGate('error')
          return
        }
        const data = (await res.json()) as { state?: { status: OnboardingStatus } }
        if (cancelled) return
        const st = data.state?.status ?? null
        if (st === 'confirmed' || st === null) {
          setGate('complete')
        } else {
          setGate('incomplete')
        }
      } catch {
        if (!cancelled) setGate('error')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user, retryKey])

  if (!user) return null

  if (gate === 'loading' || gate === 'complete' || gate === 'idle') return null

  if (gate === 'error') {
    return (
      <div className={cn(PAGE_FRAME_CLASS, 'border-b border-border bg-background py-3')}>
        <Alert variant="warning">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-foreground">{t('workspaceGate.statusErrorTitle')}</p>
              <p className="mt-1 text-muted">{t('workspaceGate.statusErrorBody')}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button type="button" size="sm" onClick={() => setRetryKey((k) => k + 1)}>
                {t('workspaceGate.retry')}
              </Button>
              <Link
                href="/onboarding"
                className="inline-flex h-8 items-center justify-center rounded-sm bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                {t('workspaceGate.cta')}
              </Link>
              <Link
                href="/settings"
                className="inline-flex h-8 items-center justify-center rounded-sm border border-border px-3 text-xs font-medium text-foreground hover:bg-hover"
              >
                {t('workspaceOnboarding.openSettings')}
              </Link>
            </div>
          </div>
        </Alert>
      </div>
    )
  }

  if (dismissed) return null

  return (
    <div className={cn(PAGE_FRAME_CLASS, 'border-b border-border bg-background py-3')}>
      <Alert variant="info">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-foreground">{t('workspaceGate.title')}</p>
            <p className="mt-1 text-muted">{t('workspaceGate.body')}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link
              href="/onboarding"
              className="inline-flex h-9 items-center justify-center rounded-sm bg-primary px-4 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              {t('workspaceGate.cta')}
            </Link>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="inline-flex h-9 items-center justify-center rounded-sm border border-border px-3 text-xs font-medium text-foreground hover:bg-hover"
            >
              {t('workspaceGate.later')}
            </button>
          </div>
        </div>
      </Alert>
    </div>
  )
}
