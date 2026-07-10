'use client'

import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from '@/components/molecules/Toast'
import type { ContactDTO, ContactFormValues } from './types'
import {
  prospectContactsQueryKey,
  prospectDetailQueryKey,
  prospectHeaderQueryKey,
} from '@/features/prospects/api/prospectDetailQueryKeys'
import { patchProspect } from '@/features/prospects/api/prospectsApi'
import type { Prospect } from '@/features/prospects/types'

async function fetchContacts(prospectId: string, signal?: AbortSignal): Promise<ContactDTO[]> {
  const res = await fetch(`/api/prospects/${prospectId}/contacts`, {
    credentials: 'include',
    signal,
  })
  if (!res.ok) return []
  const data = (await res.json()) as { items?: ContactDTO[] }
  return data.items ?? []
}

/**
 * Shared TanStack Query hook for prospect contacts — dedupes GET /contacts
 * across People, Overview, Company, Activity composer, etc.
 */
export function useProspectContacts(prospectId: string) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const queryKey = prospectContactsQueryKey(prospectId)

  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => fetchContacts(prospectId, signal),
    enabled: prospectId.length > 0,
  })

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey })
  }, [queryClient, queryKey])

  const create = useCallback(
    async (values: ContactFormValues): Promise<ContactDTO | null> => {
      const res = await fetch(`/api/prospects/${prospectId}/contacts`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) {
        toast(t('contacts.errors.create_failed'), 'error')
        return null
      }
      const data = (await res.json()) as { contact: ContactDTO }
      queryClient.setQueryData<ContactDTO[]>(queryKey, (current) =>
        [...(current ?? []), data.contact],
      )
      return data.contact
    },
    [prospectId, queryClient, queryKey, t],
  )

  const update = useCallback(
    async (id: string, values: ContactFormValues): Promise<ContactDTO | null> => {
      const res = await fetch(`/api/prospects/${prospectId}/contacts/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) {
        toast(t('contacts.errors.update_failed'), 'error')
        return null
      }
      const data = (await res.json()) as { contact: ContactDTO }
      queryClient.setQueryData<ContactDTO[]>(queryKey, (current) =>
        (current ?? []).map((c) => (c.id === id ? data.contact : c)),
      )
      return data.contact
    },
    [prospectId, queryClient, queryKey, t],
  )

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      const res = await fetch(`/api/prospects/${prospectId}/contacts/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        toast(t('contacts.errors.delete_failed'), 'error')
        return false
      }
      queryClient.setQueryData<ContactDTO[]>(queryKey, (current) =>
        (current ?? []).filter((c) => c.id !== id),
      )
      void queryClient.invalidateQueries({ queryKey: prospectHeaderQueryKey(prospectId) })
      return true
    },
    [prospectId, queryClient, queryKey, t],
  )

  return {
    contacts: query.data ?? [],
    loading: query.isLoading,
    reload: invalidate,
    create,
    update,
    remove,
  }
}

export function useSetPrimaryContactMutation(prospectId: string) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: async (contactId: string | null) => {
      const result = await patchProspect({
        prospectId,
        body: { primaryContactId: contactId },
      })
      return result.prospect
    },
    onSuccess: (prospect: Prospect) => {
      queryClient.setQueryData(prospectDetailQueryKey(prospectId), prospect)
      void queryClient.invalidateQueries({ queryKey: prospectHeaderQueryKey(prospectId) })
      toast(t('prospects.people.primarySet'), 'success')
    },
    onError: () => {
      toast(t('error.somethingWentWrong'), 'error')
    },
  })
}
