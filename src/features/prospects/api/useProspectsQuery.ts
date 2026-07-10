'use client'

import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Prospect } from '@/features/prospects/types'
import { fetchProspects, PROSPECTS_QUERY_KEY } from './prospectsApi'

/**
 * Single hook for the prospects list. Wraps TanStack Query so the UI never
 * branches on `prospects ?? []` and gets `isLoading` / `isError` for free.
 *
 * Live updates: one ref-counted Realtime channel shared by all hook instances
 * (MeetingCreateModal + ProspectsPage must not each call `.on()` after subscribe).
 */
let prospectsRealtimeRefCount = 0
let prospectsRealtimeChannel: RealtimeChannel | null = null

function acquireProspectsRealtime(queryClient: QueryClient): () => void {
  prospectsRealtimeRefCount += 1
  if (prospectsRealtimeRefCount === 1) {
    const supabase = createClient()
    prospectsRealtimeChannel = supabase
      .channel('prospects-list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prospects' },
        () => {
          void queryClient.invalidateQueries({ queryKey: PROSPECTS_QUERY_KEY })
        },
      )
      .subscribe()
  }
  return () => {
    prospectsRealtimeRefCount -= 1
    if (prospectsRealtimeRefCount <= 0) {
      prospectsRealtimeRefCount = 0
      if (prospectsRealtimeChannel) {
        const supabase = createClient()
        void supabase.removeChannel(prospectsRealtimeChannel)
        prospectsRealtimeChannel = null
      }
    }
  }
}

export function useProspectsQuery() {
  const queryClient = useQueryClient()
  const query = useQuery<Prospect[]>({
    queryKey: PROSPECTS_QUERY_KEY,
    queryFn: ({ signal }) => fetchProspects(signal),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: 1,
    retryDelay: 500,
    refetchOnWindowFocus: false,
  })

  useEffect(() => acquireProspectsRealtime(queryClient), [queryClient])

  return query
}
