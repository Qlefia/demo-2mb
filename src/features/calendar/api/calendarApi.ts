import type { CalendarScope } from '@/lib/meetings/schema'

export interface CalendarQueryParams {
  from: string
  to: string
  scope: CalendarScope
  assigneeId?: string
  prospectId?: string
  status?: string
}

export const CALENDAR_QUERY_KEY = ['calendar'] as const

export function calendarQueryKey(params: CalendarQueryParams) {
  return [...CALENDAR_QUERY_KEY, params] as const
}

export async function fetchCalendarMeetings(params: CalendarQueryParams) {
  const search = new URLSearchParams({
    from: params.from,
    to: params.to,
    scope: params.scope,
  })
  if (params.assigneeId) search.set('assigneeId', params.assigneeId)
  if (params.prospectId) search.set('prospectId', params.prospectId)
  if (params.status) search.set('status', params.status)

  const res = await fetch(`/api/calendar?${search.toString()}`, { credentials: 'include' })
  if (!res.ok) throw new Error('calendar_fetch_failed')
  return res.json() as Promise<{ items: import('@/lib/meetings/schema').CalendarMeetingDTO[]; scope: CalendarScope }>
}
