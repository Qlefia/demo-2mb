'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchProspectMeetings, prospectMeetingsQueryKey } from '@/features/meetings/api/meetingsQueryKeys'

export function useProspectMeetingsQuery(prospectId: string, enabled = true) {
  return useQuery({
    queryKey: prospectMeetingsQueryKey(prospectId),
    queryFn: () => fetchProspectMeetings(prospectId),
    enabled: Boolean(prospectId) && enabled,
    staleTime: 15_000,
  })
}
