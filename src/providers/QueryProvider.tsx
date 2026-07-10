'use client'

import { useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

/**
 * Per-process React Query client. Default cache policy is tuned for an
 * authenticated dashboard with light cross-tab collaboration:
 *
 * - `staleTime` 30s: avoids refetch storms while feeling fresh.
 * - `gcTime` 5m: keep cache around so navigating back is instant.
 * - `refetchOnWindowFocus` true: pick up changes made in another tab/device.
 * - `refetchOnReconnect` true: recover from offline gracefully.
 * - `retry` 1 on queries: network blips happen; 4xx errors don't retry.
 *
 * Realtime subscriptions (Supabase) call `queryClient.invalidateQueries`
 * directly when a relevant row changes — see `useStudioSettingsQuery`.
 */
function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: (failureCount, error) => {
          const status =
            error && typeof error === 'object' && 'status' in error
              ? Number((error as { status?: unknown }).status)
              : undefined
          if (typeof status === 'number' && status >= 400 && status < 500) return false
          return failureCount < 1
        },
      },
      mutations: {
        retry: false,
      },
    },
  })
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(makeQueryClient)

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
