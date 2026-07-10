import type { CalendarMeetingDTO } from '@/lib/meetings/schema'
import type { OpsProspectSummary, OpsTodayKpis } from '@/lib/ops/today'
import type { DashboardOpenTask } from '@/lib/dashboard/homeSnapshot'
import type { DashboardFavoriteProspect } from '@/lib/dashboard/userProspectPins'
import type { WorkspacePeriodKpis } from '@/lib/dashboard/workspaceKpis'

export const DASHBOARD_HOME_QUERY_KEY = ['dashboard', 'home'] as const

export type DashboardPeriod = 'week' | 'month'

export interface DashboardWorkload {
  activeOwnedCount: number
  totalOwnedCount: number
  byStage: Record<string, number>
}

export interface OpsHomePreviewPayload {
  triageCount: number
  dossierReviewCount: number
  triagePreview: OpsProspectSummary[]
  dossierPreview: OpsProspectSummary[]
  kpis: OpsTodayKpis
}

export interface DashboardHomePayload {
  role?: string
  workload: DashboardWorkload
  touchesLast7Days: number
  ownedActiveStages: Record<string, number>
  periodKpis: WorkspacePeriodKpis
  upcomingMeetings: CalendarMeetingDTO[]
  openTasks: DashboardOpenTask[]
  favoriteProspects: DashboardFavoriteProspect[]
  opsPreview?: OpsHomePreviewPayload
}

export async function fetchDashboardHome(
  period: DashboardPeriod,
  signal?: AbortSignal,
): Promise<DashboardHomePayload> {
  const res = await fetch(`/api/dashboard/summary?period=${period}`, {
    credentials: 'include',
    cache: 'no-store',
    signal,
  })
  if (!res.ok) {
    throw new Error('dashboard_load_failed')
  }
  return res.json() as Promise<DashboardHomePayload>
}
