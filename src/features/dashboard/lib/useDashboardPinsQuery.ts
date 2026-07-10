'use client'

import { useQuery } from '@tanstack/react-query'
import type { DashboardFavoriteProspect } from '@/lib/dashboard/userProspectPins'

export const DASHBOARD_PINS_QUERY_KEY = ['me', 'dashboard-pins'] as const

async function fetchDashboardPins(): Promise<DashboardFavoriteProspect[]> {
  const res = await fetch('/api/me/dashboard-pins', { credentials: 'include', cache: 'no-store' })
  if (!res.ok) throw new Error('pins_fetch_failed')
  const json = (await res.json()) as { items: DashboardFavoriteProspect[] }
  return json.items
}

export function useDashboardPinsQuery(enabled = true) {
  return useQuery({
    queryKey: DASHBOARD_PINS_QUERY_KEY,
    queryFn: fetchDashboardPins,
    enabled,
  })
}
