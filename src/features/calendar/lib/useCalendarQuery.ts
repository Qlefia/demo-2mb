'use client'

import { useQuery } from '@tanstack/react-query'
import { calendarQueryKey, fetchCalendarMeetings, type CalendarQueryParams } from '@/features/calendar/api/calendarApi'

export function useCalendarQuery(params: CalendarQueryParams, enabled = true) {
  return useQuery({
    queryKey: calendarQueryKey(params),
    queryFn: () => fetchCalendarMeetings(params),
    enabled,
    staleTime: 30_000,
  })
}
