'use client'

import type { Prospect } from '@/features/prospects/types'
import type { LostReason, ProspectStage, TriageDecision } from '@/lib/db/schema/enums'

export const PROSPECTS_QUERY_KEY = ['prospects', 'list'] as const

export type ProspectsListResponse = { items: Prospect[] }

export class ProspectsApiError extends Error {
  readonly status: number
  readonly payload: unknown
  constructor(message: string, status: number, payload: unknown) {
    super(message)
    this.name = 'ProspectsApiError'
    this.status = status
    this.payload = payload
  }
}

async function parseJsonOrNull(res: Response): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    return null
  }
}

/**
 * Hard client-side ceiling. If `/api/prospects` doesn't reply within this
 * window we abort and let the query surface as an error — so the UI shows
 * a retry button instead of an infinite spinner when the dev DB pool / pgbouncer
 * is stuck.
 *
 * 60s gives enough headroom for the first request after `.next` is wiped
 * (Turbopack cold-compiles `/api/prospects` + opens the first DB connection
 * to pgbouncer, easily 25–40s on a dev laptop) without making genuine
 * failures hang forever — the server itself caps statements at 30s
 * (see `src/lib/db/client.ts`).
 */
const FETCH_TIMEOUT_MS = 60_000

function prospectsFetchSignal(signal?: AbortSignal): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(FETCH_TIMEOUT_MS)
  if (!signal) return timeoutSignal
  if (signal.aborted) return signal
  return AbortSignal.any([signal, timeoutSignal])
}

/**
 * Fetch the prospects list. Aborts cleanly when the React Query observer is
 * unmounted (`signal` from `useQuery`). AbortError must propagate so TanStack
 * Query can transition to the cancelled state instead of resolving with `null`.
 */
export async function fetchProspects(signal?: AbortSignal): Promise<Prospect[]> {
  const res = await fetch('/api/prospects', {
    credentials: 'include',
    signal: prospectsFetchSignal(signal),
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new ProspectsApiError('prospects_list_failed', res.status, await parseJsonOrNull(res))
  }

  const data = (await res.json()) as ProspectsListResponse
  return data.items ?? []
}

export interface PatchProspectInput {
  prospectId: string
  body: {
    stage?: ProspectStage
    ownerId?: string | null
    triageDecision?: TriageDecision
    lostReason?: LostReason | null
    primaryContactId?: string | null
    suggestedPlaybookId?: string | null
    quickNote?: string | null
  }
}

export interface PatchProspectResult {
  prospect: Prospect
}

export async function patchProspect(input: PatchProspectInput): Promise<PatchProspectResult> {
  const res = await fetch(`/api/prospects/${input.prospectId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input.body),
  })
  if (!res.ok) {
    throw new ProspectsApiError('prospect_patch_failed', res.status, await parseJsonOrNull(res))
  }
  return (await res.json()) as PatchProspectResult
}

export async function fetchProspect(
  prospectId: string,
  signal?: AbortSignal,
): Promise<Prospect | null> {
  const res = await fetch(`/api/prospects/${prospectId}`, {
    credentials: 'include',
    signal,
    cache: 'no-store',
  })
  if (res.status === 404) return null
  if (!res.ok) {
    throw new ProspectsApiError('prospect_fetch_failed', res.status, await parseJsonOrNull(res))
  }
  const data = (await res.json()) as { prospect: Prospect }
  return data.prospect
}
