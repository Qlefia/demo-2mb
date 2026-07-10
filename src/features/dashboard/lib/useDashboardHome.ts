'use client'

import { useQuery } from '@tanstack/react-query'
import {
  DASHBOARD_HOME_QUERY_KEY,
  fetchDashboardHome,
  type DashboardPeriod,
} from '@/features/dashboard/lib/dashboardApi'

export function useDashboardHome(period: DashboardPeriod) {
  return useQuery({
    queryKey: [...DASHBOARD_HOME_QUERY_KEY, period],
    queryFn: ({ signal }) => fetchDashboardHome(period, signal),
  })
}
