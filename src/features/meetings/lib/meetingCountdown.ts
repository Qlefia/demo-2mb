'use client'

import { useEffect, useState } from 'react'
import type { MeetingStatus } from '@/lib/db/schema/enums'

export type MeetingCountdownPhase = 'idle' | 'untilStart' | 'untilEnd' | 'overdue'

export type MeetingCountdown = {
  phase: MeetingCountdownPhase
  seconds: number
}

export function computeMeetingCountdown(
  startsAt: string,
  endsAt: string | null,
  status: MeetingStatus,
  nowMs: number,
): MeetingCountdown {
  if (status !== 'scheduled') {
    return { phase: 'idle', seconds: 0 }
  }

  const startMs = new Date(startsAt).getTime()
  const endMs = endsAt ? new Date(endsAt).getTime() : null
  const toStartSec = Math.round((startMs - nowMs) / 1000)

  if (toStartSec > 0) {
    return { phase: 'untilStart', seconds: toStartSec }
  }

  if (endMs != null) {
    const toEndSec = Math.round((endMs - nowMs) / 1000)
    if (toEndSec > 0) {
      return { phase: 'untilEnd', seconds: toEndSec }
    }
  }

  return { phase: 'overdue', seconds: Math.abs(toStartSec) }
}

export function formatCountdownSeconds(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60

  const parts: string[] = []
  if (h > 0) parts.push(`${h}h`)
  if (m > 0) parts.push(`${m}min`)
  parts.push(`${s}s`)
  return parts.join(' ')
}

export function useMeetingCountdown(
  startsAt: string,
  endsAt: string | null,
  status: MeetingStatus,
): MeetingCountdown {
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    if (status !== 'scheduled') return
    const id = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [status, startsAt, endsAt])

  return computeMeetingCountdown(startsAt, endsAt, status, nowMs)
}
