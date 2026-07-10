'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DASHBOARD_HOME_QUERY_KEY,
  type DashboardHomePayload,
} from '@/features/dashboard/lib/dashboardApi'
import { DASHBOARD_PINS_QUERY_KEY } from '@/features/dashboard/lib/useDashboardPinsQuery'
import type { DashboardFavoriteProspect } from '@/lib/dashboard/userProspectPins'

async function togglePin(prospectId: string): Promise<{ pinned: boolean; items: DashboardFavoriteProspect[] }> {
  const res = await fetch('/api/me/dashboard-pins', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prospectId }),
  })
  if (!res.ok) {
    const json = (await res.json()) as { error?: string }
    throw new Error(json.error ?? 'toggle_failed')
  }
  return res.json() as Promise<{ pinned: boolean; items: DashboardFavoriteProspect[] }>
}

export function useToggleProspectPin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: togglePin,
    onSuccess: (result) => {
      queryClient.setQueryData(DASHBOARD_PINS_QUERY_KEY, result.items)
      queryClient.setQueriesData<DashboardHomePayload>(
        { queryKey: DASHBOARD_HOME_QUERY_KEY },
        (prev) => (prev ? { ...prev, favoriteProspects: result.items } : prev),
      )
    },
  })
}

export function isProspectPinned(
  favorites: DashboardFavoriteProspect[] | undefined,
  prospectId: string,
): boolean {
  return favorites?.some((f) => f.prospectId === prospectId) ?? false
}
