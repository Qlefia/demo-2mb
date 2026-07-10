'use client'

import {
  emptyStudioSalesSnapshot,
  isStudioSalesSnapshot,
  type StudioSalesSnapshot,
} from '@/lib/studio/studioProfileSnapshot'

export const STUDIO_SETTINGS_QUERY_KEY = ['workspace-studio-settings'] as const

export class StudioSettingsFetchError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`studio_settings_fetch_${status}`)
    this.name = 'StudioSettingsFetchError'
    this.status = status
  }
}

export type StudioSettingsRow = {
  workspaceId: string
  revision: number
  general: unknown
  sales: StudioSalesSnapshot
}

export type StudioSettingsPayload = {
  general: Record<string, unknown>
  sales: StudioSalesSnapshot
}

export type StudioSettingsPutResult =
  | { ok: true; revision: number }
  | { ok: false; status: number; field?: string; serverRevision?: number }

/**
 * GET /api/workspace/studio-settings — returns null on 401/403/network.
 *
 * AbortError must propagate (re-thrown as-is) so TanStack Query marks the
 * query as "cancelled" and triggers no error state/overlay. The Next.js dev
 * overlay shows `Runtime AbortError: signal is aborted without reason` only
 * when the rejection escapes to the global scope — silently swallowing it
 * here (returning null) caused the empty-UI symptom because the cancelled
 * GET resolved as an empty row and `applyRemoteRow` then locked sync at
 * revision 0.
 */
export async function fetchStudioSettings(signal?: AbortSignal): Promise<StudioSettingsRow | null> {
  let res: Response
  try {
    res = await fetch('/api/workspace/studio-settings', {
      credentials: 'include',
      signal,
    })
  } catch (err) {
    if ((err as Error | undefined)?.name === 'AbortError') throw err
    return null
  }
  if (!res.ok) {
    throw new StudioSettingsFetchError(res.status)
  }
  let raw: Partial<StudioSettingsRow>
  try {
    raw = (await res.json()) as Partial<StudioSettingsRow>
  } catch (err) {
    if ((err as Error | undefined)?.name === 'AbortError') throw err
    return null
  }
  if (typeof raw.workspaceId !== 'string' || typeof raw.revision !== 'number') return null
  return {
    workspaceId: raw.workspaceId,
    revision: raw.revision,
    general: raw.general ?? {},
    sales: isStudioSalesSnapshot(raw.sales) ? raw.sales : emptyStudioSalesSnapshot(),
  }
}

/** PUT /api/workspace/studio-settings — bumps `revision`, never empties non-empty arrays. */
export async function putStudioSettings(input: {
  expectedRevision?: number
  payload: StudioSettingsPayload
  force?: boolean
}): Promise<StudioSettingsPutResult> {
  const res = await fetch('/api/workspace/studio-settings', {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      expectedRevision: input.expectedRevision,
      force: input.force,
      general: input.payload.general,
      sales: input.payload.sales,
    }),
  })

  if (res.ok) {
    const body = (await res.json()) as { revision?: number }
    return { ok: true, revision: typeof body.revision === 'number' ? body.revision : 0 }
  }

  if (res.status === 409 || res.status === 422) {
    try {
      const body = (await res.json()) as { revision?: number; field?: string }
      return {
        ok: false,
        status: res.status,
        field: body.field,
        serverRevision: typeof body.revision === 'number' ? body.revision : undefined,
      }
    } catch {
      return { ok: false, status: res.status }
    }
  }

  return { ok: false, status: res.status }
}
