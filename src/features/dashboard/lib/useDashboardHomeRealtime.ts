'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { DASHBOARD_HOME_QUERY_KEY } from '@/features/dashboard/lib/dashboardApi'

const OPS_HOME_ROLES = new Set(['founder', 'ops', 'admin'])

export interface UseDashboardHomeRealtimeOptions {
  active: boolean
  userId: string | null | undefined
  role?: string | null
}

function invalidateDashboardHome(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: DASHBOARD_HOME_QUERY_KEY })
}

/**
 * Supabase Realtime → TanStack Query invalidation for HomeDashboard.
 * Invalidates all period variants via `DASHBOARD_HOME_QUERY_KEY` prefix.
 */
export function useDashboardHomeRealtime({
  active,
  userId,
  role,
}: UseDashboardHomeRealtimeOptions): void {
  const queryClient = useQueryClient()
  const includeOpsTables = Boolean(role && OPS_HOME_ROLES.has(role))

  useEffect(() => {
    if (!active || !userId) return

    const supabase = createClient()
    const invalidate = () => invalidateDashboardHome(queryClient)

    let channel = supabase.channel(`dashboard-home:${userId}`)

    channel = channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prospects' }, invalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, invalidate)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `assignee_id=eq.${userId}`,
        },
        invalidate,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meetings',
          filter: `assignee_id=eq.${userId}`,
        },
        invalidate,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meetings',
          filter: `organiser_id=eq.${userId}`,
        },
        invalidate,
      )

    if (includeOpsTables) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dossiers' },
        invalidate,
      )
    }

    channel = channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_prospect_pins',
        filter: `user_id=eq.${userId}`,
      },
      invalidate,
    )

    channel.subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [active, userId, includeOpsTables, queryClient])
}
