'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'
import { LogOut, Monitor, Smartphone } from 'lucide-react'
import { Button, IconButton } from '@/components/atoms'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'
import { toast } from '@/components/molecules/Toast'
import { parseUserAgent } from '@/lib/auth/parseUserAgent'
import { normaliseLocale } from '@/lib/intl/datetime'

type SessionDto = {
  id: string
  isCurrent: boolean
  createdAt: string
  lastActiveAt: string
  userAgent: string | null
  ip: string | null
}

type SessionsResponse = {
  currentSessionId: string | null
  sessions: SessionDto[]
}

function formatRelativeTime(iso: string, lng: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(diffMs / 60_000)
  const locale = normaliseLocale(lng)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  if (Math.abs(minutes) < 1) return rtf.format(0, 'minute')
  if (Math.abs(minutes) < 60) return rtf.format(-minutes, 'minute')

  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return rtf.format(-hours, 'hour')

  const days = Math.round(hours / 24)
  return rtf.format(-days, 'day')
}

export function ActiveSessions() {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const [sessions, setSessions] = useState<SessionDto[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [bulkBusy, setBulkBusy] = useState<'others' | 'global' | null>(null)
  const [confirmAllOpen, setConfirmAllOpen] = useState(false)

  const loadSessions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/me/sessions', { credentials: 'include' })
      if (!res.ok) {
        setSessions([])
        return
      }
      const data = (await res.json()) as SessionsResponse
      setSessions(data.sessions ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSessions()
  }, [loadSessions])

  async function handleSignedOutCurrent() {
    router.push('/login')
    router.refresh()
  }

  async function revokeSession(sessionId: string) {
    setBusyId(sessionId)
    try {
      const res = await fetch(`/api/me/sessions/${sessionId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = (await res.json()) as { signedOutCurrent?: boolean; error?: string }
      if (!res.ok) {
        toast(t('settingsPage.revokeSessionError'), 'error')
        return
      }
      if (data.signedOutCurrent) {
        toast(t('settingsPage.revokeSessionSuccess'), 'success')
        await handleSignedOutCurrent()
        return
      }
      toast(t('settingsPage.revokeSessionSuccess'), 'success')
      await loadSessions()
    } finally {
      setBusyId(null)
    }
  }

  async function signOutScope(scope: 'others' | 'global') {
    setBulkBusy(scope)
    try {
      const res = await fetch('/api/me/sessions', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope }),
      })
      const data = (await res.json()) as { signedOut?: boolean; error?: string }
      if (!res.ok) {
        toast(
          scope === 'others' ? t('settingsPage.signOutOthersError') : t('settingsPage.signOutAllError'),
          'error',
        )
        return
      }
      if (data.signedOut) {
        toast(t('settingsPage.signOutAllSuccess'), 'success')
        await handleSignedOutCurrent()
        return
      }
      toast(t('settingsPage.signOutOthersSuccess'), 'success')
      await loadSessions()
    } finally {
      setBulkBusy(null)
      setConfirmAllOpen(false)
    }
  }

  const otherCount = sessions.filter((s) => !s.isCurrent).length

  if (loading) {
    return (
      <div className="max-w-lg animate-pulse space-y-4 max-lg:pt-5">
        <div className="h-20 rounded-sm bg-primary/5" />
      </div>
    )
  }

  return (
    <div className="max-w-lg space-y-6 max-lg:pt-5">
      <div>
        <h3 className="text-sm font-medium">{t('settingsPage.activeSessions')}</h3>
        <p className="mt-1 text-xs text-muted">{t('settingsPage.activeSessionsDesc')}</p>
      </div>

      {sessions.length > 0 ? (
        <div className="space-y-3">
          {sessions.map((session) => {
            const parsed = parseUserAgent(session.userAgent)
            const Icon = parsed.device === 'Mobile' ? Smartphone : Monitor
            return (
              <div key={session.id} className="rounded-sm border border-border p-4">
                <div className="flex items-start gap-3">
                  <Icon size={20} className="mt-0.5 shrink-0 text-muted" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">
                        {parsed.browser} — {parsed.os}
                      </p>
                      {session.isCurrent ? (
                        <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-600">
                          {t('settingsPage.currentSession')}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      {parsed.device}
                      {' · '}
                      {t('settingsPage.lastActive')}: {formatRelativeTime(session.lastActiveAt, i18n.language)}
                    </p>
                  </div>
                  {!session.isCurrent ? (
                    <IconButton
                      type="button"
                      size="sm"
                      variant="ghost"
                      icon={LogOut}
                      label={t('settingsPage.revokeSession')}
                      disabled={busyId === session.id || bulkBusy !== null}
                      onClick={() => void revokeSession(session.id)}
                    />
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-muted">{t('settingsPage.activeSessionsEmpty')}</p>
      )}

      {sessions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={otherCount === 0 || bulkBusy !== null || busyId !== null}
            onClick={() => void signOutScope('others')}
          >
            {bulkBusy === 'others' ? t('common.loading') : t('settingsPage.signOutOtherSessions')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={bulkBusy !== null || busyId !== null}
            onClick={() => setConfirmAllOpen(true)}
          >
            {t('settingsPage.signOutAllSessions')}
          </Button>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmAllOpen}
        onClose={() => setConfirmAllOpen(false)}
        title={t('settingsPage.signOutAllConfirmTitle')}
        message={t('settingsPage.signOutAllConfirmBody')}
        confirmLabel={t('settingsPage.signOutAllSessions')}
        variant="destructive"
        loading={bulkBusy === 'global'}
        onConfirm={() => void signOutScope('global')}
      />
    </div>
  )
}
