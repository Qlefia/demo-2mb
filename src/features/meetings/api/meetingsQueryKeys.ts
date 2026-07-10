import type { QueryClient } from '@tanstack/react-query'
import { CALENDAR_QUERY_KEY } from '@/features/calendar/api/calendarApi'
import { DASHBOARD_HOME_QUERY_KEY } from '@/features/dashboard/lib/dashboardApi'
import { prospectHeaderQueryKey } from '@/features/prospects/api/prospectDetailQueryKeys'
import type { MeetingDTO } from '@/lib/meetings/schema'

export const PROSPECT_MEETINGS_QUERY_KEY = ['prospect-meetings'] as const

export function prospectMeetingsQueryKey(prospectId: string) {
  return [...PROSPECT_MEETINGS_QUERY_KEY, prospectId] as const
}

export async function fetchProspectMeetings(prospectId: string): Promise<MeetingDTO[]> {
  const res = await fetch(`/api/prospects/${prospectId}/meetings`, { credentials: 'include' })
  if (!res.ok) throw new Error('meetings_fetch_failed')
  const data = (await res.json()) as { items?: MeetingDTO[] }
  return data.items ?? []
}

export async function refetchMeetingSurfaces(queryClient: QueryClient, prospectId: string) {
  await Promise.all([
    queryClient.refetchQueries({ queryKey: CALENDAR_QUERY_KEY }),
    queryClient.refetchQueries({ queryKey: prospectMeetingsQueryKey(prospectId) }),
    queryClient.invalidateQueries({ queryKey: prospectHeaderQueryKey(prospectId) }),
    queryClient.invalidateQueries({ queryKey: DASHBOARD_HOME_QUERY_KEY }),
  ])
}
