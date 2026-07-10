'use client'

import { useQuery } from '@tanstack/react-query'
import {
  fetchProspect,
  fetchProspectDossier,
  fetchProspectEnrichmentJobs,
  fetchProspectHeader,
  prospectDetailQueryKey,
  prospectDossierQueryKey,
  prospectEnrichmentJobsQueryKey,
  prospectHeaderQueryKey,
} from './prospectDetailApi'

export function useProspectQuery(prospectId: string | null) {
  return useQuery({
    queryKey: prospectId ? prospectDetailQueryKey(prospectId) : ['prospect', 'detail', 'none'],
    queryFn: ({ signal }) => {
      if (!prospectId) return Promise.resolve(null)
      return fetchProspect(prospectId, signal)
    },
    enabled: Boolean(prospectId),
  })
}

export function useProspectHeaderQuery(prospectId: string | null) {
  return useQuery({
    queryKey: prospectId ? prospectHeaderQueryKey(prospectId) : ['prospect', 'header', 'none'],
    queryFn: ({ signal }) => {
      if (!prospectId) throw new Error('missing_prospect_id')
      return fetchProspectHeader(prospectId, signal)
    },
    enabled: Boolean(prospectId),
    staleTime: 30_000,
  })
}

export function useProspectDossierQuery(prospectId: string | null) {
  return useQuery({
    queryKey: prospectId ? prospectDossierQueryKey(prospectId) : ['prospect', 'dossier', 'none'],
    queryFn: ({ signal }) => {
      if (!prospectId) throw new Error('missing_prospect_id')
      return fetchProspectDossier(prospectId, signal)
    },
    enabled: Boolean(prospectId),
  })
}

export function useProspectEnrichmentJobsQuery(prospectId: string | null) {
  return useQuery({
    queryKey: prospectId
      ? prospectEnrichmentJobsQueryKey(prospectId)
      : ['prospect', 'enrichment-jobs', 'none'],
    queryFn: ({ signal }) => {
      if (!prospectId) return Promise.resolve([])
      return fetchProspectEnrichmentJobs(prospectId, signal)
    },
    enabled: Boolean(prospectId),
  })
}

export type {
  ProspectHeaderDTO,
  ProspectLastActivity,
  ProspectNextTask,
  ProspectOpenDeal,
} from '@/lib/prospects/headerData'
