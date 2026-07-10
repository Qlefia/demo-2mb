'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ClientProjectDTO } from '@/lib/client-projects/schema'
import { prospectProjectsQueryKey } from '@/features/client-projects/api/clientProjectsQueryKeys'

async function fetchProjects(prospectId: string, signal?: AbortSignal): Promise<ClientProjectDTO[]> {
  const res = await fetch(`/api/prospects/${prospectId}/projects`, {
    credentials: 'include',
    cache: 'no-store',
    signal,
  })
  if (!res.ok) return []
  const data = (await res.json()) as { items?: ClientProjectDTO[] }
  return data.items ?? []
}

export function useProspectProjectsQuery(prospectId: string) {
  return useQuery({
    queryKey: prospectProjectsQueryKey(prospectId),
    queryFn: ({ signal }) => fetchProjects(prospectId, signal),
    staleTime: 30_000,
  })
}

export function useCreateClientProjectMutation(prospectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: {
      title: string
      description?: string | null
      estimatedValue?: number | null
      currency?: string
    }) => {
      const res = await fetch(`/api/prospects/${prospectId}/projects`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('create_failed')
      const data = (await res.json()) as { project: ClientProjectDTO }
      return data.project
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: prospectProjectsQueryKey(prospectId) })
    },
  })
}

export function useAcceptOfferMutation(prospectId: string, projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (offerId: string) => {
      const res = await fetch(
        `/api/prospects/${prospectId}/projects/${projectId}/accept-offer`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ offerId }),
        },
      )
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(payload.error ?? 'accept_failed')
      }
      const data = (await res.json()) as { project: ClientProjectDTO }
      return data.project
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: prospectProjectsQueryKey(prospectId) })
    },
  })
}
