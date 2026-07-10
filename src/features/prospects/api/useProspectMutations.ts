'use client'

import { useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Prospect } from '@/features/prospects/types'
import type { LostReason, ProspectStage } from '@/lib/db/schema/enums'
import { patchProspect, PROSPECTS_QUERY_KEY, ProspectsApiError } from './prospectsApi'

/**
 * Apply a partial update to one prospect in the cached list. Returns the
 * previous list so the caller can roll back on failure.
 */
function patchListCache(
  queryClient: ReturnType<typeof useQueryClient>,
  prospectId: string,
  patch: Partial<Prospect>,
): Prospect[] | undefined {
  const previous = queryClient.getQueryData<Prospect[]>(PROSPECTS_QUERY_KEY)
  if (!previous) return previous
  const next = previous.map((p) =>
    p.id === prospectId ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p,
  )
  queryClient.setQueryData(PROSPECTS_QUERY_KEY, next)
  return previous
}

function restoreListCache(
  queryClient: ReturnType<typeof useQueryClient>,
  previous: Prospect[] | undefined,
): void {
  if (previous) queryClient.setQueryData(PROSPECTS_QUERY_KEY, previous)
}

export interface ChangeStageVariables {
  prospectId: string
  fromStage: ProspectStage
  toStage: ProspectStage
  /** Required by the API when moving to `lost`. */
  lostReason?: LostReason
}

/**
 * Drag-drop / dropdown stage transition with optimistic update and rollback.
 * Adds `triageDecision: 'accept'` when leaving `new → triaged` to mirror the
 * legacy code path.
 */
export function useChangeProspectStageMutation() {
  const queryClient = useQueryClient()
  return useMutation<{ prospect: Prospect }, ProspectsApiError, ChangeStageVariables, { previous?: Prospect[] }>({
    mutationFn: ({ prospectId, fromStage, toStage, lostReason }) =>
      patchProspect({
        prospectId,
        body: {
          stage: toStage,
          ...(fromStage === 'new' && toStage === 'triaged' ? { triageDecision: 'accept' } : {}),
          ...(fromStage === 'new' && toStage === 'lost' ? { triageDecision: 'reject' } : {}),
          ...(toStage === 'lost' && lostReason ? { lostReason } : {}),
        },
      }),
    onMutate: ({ prospectId, toStage }) => {
      const previous = patchListCache(queryClient, prospectId, {
        stage: toStage,
        ...(toStage === 'dossier_ready' ? { dossierStatus: 'ready' as const } : {}),
      })
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      restoreListCache(queryClient, ctx?.previous)
    },
    onSuccess: ({ prospect }) => {
      queryClient.setQueryData<Prospect[]>(PROSPECTS_QUERY_KEY, (current) =>
        current?.map((p) => (p.id === prospect.id ? prospect : p)),
      )
    },
  })
}

export interface ReassignOwnerVariables {
  prospectId: string
  nextOwnerId: string | null
  /** Optional pre-computed label so the optimistic UI shows the new name. */
  nextOwnerLabel?: string | null
}

export function useReassignProspectOwnerMutation() {
  const queryClient = useQueryClient()
  return useMutation<{ prospect: Prospect }, ProspectsApiError, ReassignOwnerVariables, { previous?: Prospect[] }>({
    mutationFn: ({ prospectId, nextOwnerId }) =>
      patchProspect({ prospectId, body: { ownerId: nextOwnerId } }),
    onMutate: ({ prospectId, nextOwnerId, nextOwnerLabel }) => {
      const previous = patchListCache(queryClient, prospectId, {
        ownerId: nextOwnerId,
        ownerLabel: nextOwnerLabel ?? null,
      })
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      restoreListCache(queryClient, ctx?.previous)
    },
    onSuccess: ({ prospect }) => {
      queryClient.setQueryData<Prospect[]>(PROSPECTS_QUERY_KEY, (current) =>
        current?.map((p) => (p.id === prospect.id ? prospect : p)),
      )
    },
  })
}

/**
 * Imperative cache patch — used when a child component (detail page, dossier
 * editor) wants to push a fresh prospect snapshot into the list cache without
 * going through a network round-trip.
 */
export function useUpsertProspectCache() {
  const queryClient = useQueryClient()
  return useCallback(
    (prospect: Prospect) => {
      queryClient.setQueryData<Prospect[]>(PROSPECTS_QUERY_KEY, (current) => {
        if (!current) return current
        const idx = current.findIndex((p) => p.id === prospect.id)
        if (idx === -1) return [prospect, ...current]
        const next = [...current]
        next[idx] = prospect
        return next
      })
    },
    [queryClient],
  )
}
