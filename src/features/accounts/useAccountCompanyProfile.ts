'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AccountCompanyProfile } from '@/lib/accounts/companyProfile'
import {
  fetchAccountCompanyProfile,
  putAccountCompanyProfile,
} from './accountCompanyProfileApi'

export const ACCOUNT_COMPANY_PROFILE_QUERY_KEY = ['account-company-profile'] as const

export function accountCompanyProfileQueryKey(accountId: string) {
  return [...ACCOUNT_COMPANY_PROFILE_QUERY_KEY, accountId] as const
}

export function useAccountCompanyProfile(accountId: string) {
  return useQuery({
    queryKey: accountCompanyProfileQueryKey(accountId),
    queryFn: () => fetchAccountCompanyProfile(accountId),
    enabled: Boolean(accountId),
    staleTime: 60_000,
  })
}

export function useSaveAccountCompanyProfile(accountId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AccountCompanyProfile) => putAccountCompanyProfile(accountId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(accountCompanyProfileQueryKey(accountId), data)
    },
  })
}
