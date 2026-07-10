'use client'

import { useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { studioProfileSnapshotFromState } from '@/lib/studio/studioProfileSnapshot'
import { useStudioProfileStore, type StudioProfileState } from '@/stores/studioProfileStore'
import {
  studioProfileSyncIsApplyingRemote,
  studioProfileSyncIsEnabled,
  studioProfileSyncLastAppliedRevision,
  studioProfileSyncLastPushedRevision,
  studioProfileSyncSetApplyingRemote,
  studioProfileSyncSetEnabled,
  studioProfileSyncSetHasHydrated,
  studioProfileSyncSetLastAppliedRevision,
  studioProfileSyncSetLastPushedRevision,
} from '@/features/studio-settings/lib/studioProfileSyncState'
import {
  fetchStudioSettings,
  putStudioSettings,
  STUDIO_SETTINGS_QUERY_KEY,
  StudioSettingsFetchError,
  type StudioSettingsRow,
} from '@/features/studio-settings/lib/studioSettingsApi'

const PUSH_DEBOUNCE_MS = 700

/**
 * Legacy localStorage key from the pre-2026-05-21 Zustand persist approach.
 * Kept here as a one-shot cleanup so users don't carry a stale empty snapshot
 * across sessions (which is what caused the data-loss incident).
 */
const LEGACY_LOCAL_STORAGE_KEY = '2mb-studio-profile'

function pickStoreSlice(state: StudioProfileState) {
  return {
    general: state.general,
    serviceCatalog: state.serviceCatalog,
    serviceGroups: state.serviceGroups,
    segments: state.segments,
    works: state.works,
    reviews: state.reviews,
    tools: state.tools,
    products: state.products,
  }
}

/**
 * Apply a server row to the in-memory Zustand store. Server is the source of
 * truth — old/stale revisions are silently ignored. Wrapping with the
 * `applyingRemote` flag prevents the subscriber from echoing the apply back as
 * a fresh PUT.
 */
function applyRemoteRow(row: StudioSettingsRow): void {
  if (!Number.isFinite(row.revision) || row.revision <= studioProfileSyncLastAppliedRevision()) {
    return
  }
  studioProfileSyncSetApplyingRemote(true)
  try {
    useStudioProfileStore.getState().hydrateFromServer({
      general: row.general,
      serviceCatalog: row.sales.serviceCatalog,
      serviceGroups: row.sales.serviceGroups,
      segments: row.sales.segments,
      works: row.sales.works,
      reviews: row.sales.reviews,
      tools: row.sales.tools,
      products: row.sales.products,
    })
    studioProfileSyncSetLastAppliedRevision(row.revision)
    studioProfileSyncSetLastPushedRevision(row.revision)
  } finally {
    studioProfileSyncSetApplyingRemote(false)
  }
}

/**
 * Loads workspace studio settings from Supabase via TanStack Query, pushes
 * local edits (debounced) through a mutation, and applies Realtime postgres
 * changes by invalidating the query cache (no manual hydration race).
 *
 * Defense-in-depth against the 2026-05-21 data-loss incident:
 *  - Client never persists server data to `localStorage` (removed from
 *    `studioProfileStore`'s persist middleware).
 *  - This hook only enables auto-push AFTER the first successful GET+apply.
 *  - The server route refuses any PUT that would empty a previously
 *    non-empty protected array (offices, services, segments, works, reviews,
 *    templates, sections, bank accounts, brands); see
 *    `saveWorkspaceStudioSettings` in `workspaceStudioSettingsData.ts`.
 */
export function useStudioProfileSync(active: boolean): void {
  const queryClient = useQueryClient()
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  /**
   * Tracks an in-flight push so concurrent edits coalesce instead of racing.
   * Without this guard, fast successive store edits (e.g. typing IBAN +
   * BankName + Label in the bank-account detail page) can queue a second
   * `mutation.mutate(...)` before the first round-trip's `onSuccess`
   * updates `lastPushedRevision` — that second PUT then ships a stale
   * `expectedRevision` and the server replies 409 → query is invalidated →
   * `applyRemoteRow` overwrites the *still in-memory* (and unsaved) IBAN +
   * BankName with the older server snapshot. Net result: silent data loss
   * on the very screen this refactor introduced.
   */
  const inFlightRef = useRef<boolean>(false)
  const pendingPushRef = useRef<boolean>(false)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY)
    } catch {
      // SecurityError in some environments — ignore, nothing to clean up.
    }
  }, [])

  const query = useQuery({
    queryKey: STUDIO_SETTINGS_QUERY_KEY,
    queryFn: ({ signal }) => fetchStudioSettings(signal),
    enabled: active,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: (failureCount, error) => {
      if (failureCount >= 3) return false
      if (error instanceof StudioSettingsFetchError) {
        if (error.status >= 400 && error.status < 500) return false
        return true
      }
      return failureCount < 2
    },
    retryDelay: (attempt) => Math.min(400 * 2 ** attempt, 3000),
  })

  const mutation = useMutation({
    mutationFn: putStudioSettings,
    onSuccess: (result) => {
      if (result.ok) {
        studioProfileSyncSetLastPushedRevision(result.revision)
        studioProfileSyncSetLastAppliedRevision(result.revision)
        return
      }
      if (result.status === 409 || result.status === 422) {
        if (result.status === 422) {
          console.warn('[studio-sync] push rejected (nonempty_overwrite)', { field: result.field })
        }
        if (typeof result.serverRevision === 'number') {
          studioProfileSyncSetLastPushedRevision(result.serverRevision)
        }
        void queryClient.invalidateQueries({ queryKey: STUDIO_SETTINGS_QUERY_KEY })
      }
    },
    onSettled: () => {
      inFlightRef.current = false
      if (!pendingPushRef.current) return
      pendingPushRef.current = false
      // Always push the *current* store snapshot, not the one captured when
      // the deferred push was requested — by the time the in-flight PUT
      // settled, more edits may have landed and we want to ship them all.
      const lastPushed = studioProfileSyncLastPushedRevision()
      const snapshot = studioProfileSnapshotFromState(pickStoreSlice(useStudioProfileStore.getState()))
      inFlightRef.current = true
      mutation.mutate({
        expectedRevision: lastPushed > 0 ? lastPushed : undefined,
        payload: { general: snapshot.general, sales: snapshot.sales },
      })
    },
  })

  useEffect(() => {
    const row = query.data
    if (!row) return
    applyRemoteRow(row)
    studioProfileSyncSetHasHydrated(true)
    studioProfileSyncSetEnabled(true)
  }, [query.data])

  useEffect(() => {
    if (!active) return
    const unsubscribe = useStudioProfileStore.subscribe(() => {
      if (!studioProfileSyncIsEnabled() || studioProfileSyncIsApplyingRemote()) return
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current)
      pushTimerRef.current = setTimeout(() => {
        // Coalesce with any in-flight PUT — `onSettled` will trigger one
        // catch-up push using the freshest store snapshot + the new revision
        // returned by the server. See `inFlightRef` doc above.
        if (inFlightRef.current) {
          pendingPushRef.current = true
          return
        }
        const lastPushed = studioProfileSyncLastPushedRevision()
        const snapshot = studioProfileSnapshotFromState(pickStoreSlice(useStudioProfileStore.getState()))
        inFlightRef.current = true
        mutation.mutate({
          expectedRevision: lastPushed > 0 ? lastPushed : undefined,
          payload: { general: snapshot.general, sales: snapshot.sales },
        })
      }, PUSH_DEBOUNCE_MS)
    })
    return () => {
      if (pushTimerRef.current) {
        clearTimeout(pushTimerRef.current)
        pushTimerRef.current = null
      }
      unsubscribe()
    }
  }, [active, mutation])

  useEffect(() => {
    if (!active) {
      studioProfileSyncSetEnabled(false)
      return
    }
    const workspaceId = query.data?.workspaceId
    if (!workspaceId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`workspace-studio-settings:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_studio_settings',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: STUDIO_SETTINGS_QUERY_KEY })
        },
      )
      .subscribe()
    channelRef.current = channel

    return () => {
      void supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [active, query.data?.workspaceId, queryClient])

  useEffect(() => {
    return () => {
      studioProfileSyncSetEnabled(false)
      studioProfileSyncSetHasHydrated(false)
    }
  }, [])
}
