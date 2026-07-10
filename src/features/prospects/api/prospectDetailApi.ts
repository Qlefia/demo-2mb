'use client'

import type { ProspectHeaderDTO } from '@/lib/prospects/headerData'
import type { DossierRecordDTO } from '@/features/dossiers/types'
import type { DossierSections } from '@/lib/dossiers/schema'
import { EMPTY_SECTIONS } from '@/lib/dossiers/schema'
import { fetchProspect } from './prospectsApi'
import {
  prospectDetailQueryKey,
  prospectDossierQueryKey,
  prospectEnrichmentJobsQueryKey,
  prospectHeaderQueryKey,
} from './prospectDetailQueryKeys'

export interface EnrichmentJobRow {
  id: string
  provider: string
  status: string
  error: string | null
  startedAt: string | null
  finishedAt: string | null
  createdAt: string
}

export interface DossierQueryResult {
  dossier: DossierRecordDTO | null
  sections: DossierSections
}

export async function fetchProspectHeader(
  prospectId: string,
  signal?: AbortSignal,
): Promise<ProspectHeaderDTO> {
  const res = await fetch(`/api/prospects/${prospectId}/header`, {
    credentials: 'include',
    signal,
    cache: 'no-store',
  })
  if (res.status === 404) throw new Error('not_found')
  if (!res.ok) throw new Error('header_fetch_failed')
  return (await res.json()) as ProspectHeaderDTO
}

export async function fetchProspectDossier(
  prospectId: string,
  signal?: AbortSignal,
): Promise<DossierQueryResult> {
  const res = await fetch(`/api/prospects/${prospectId}/dossier`, {
    credentials: 'include',
    signal,
    cache: 'no-store',
  })
  if (!res.ok) {
    return { dossier: null, sections: EMPTY_SECTIONS }
  }
  const data = (await res.json()) as { dossier: DossierRecordDTO | null; sections: DossierSections | null }
  return {
    dossier: data.dossier,
    sections: data.sections ?? EMPTY_SECTIONS,
  }
}

export async function fetchProspectEnrichmentJobs(
  prospectId: string,
  signal?: AbortSignal,
): Promise<EnrichmentJobRow[]> {
  const res = await fetch(`/api/prospects/${prospectId}/enrichment-jobs`, {
    credentials: 'include',
    signal,
    cache: 'no-store',
  })
  if (!res.ok) return []
  const data = (await res.json()) as { items?: EnrichmentJobRow[] }
  return data.items ?? []
}

export {
  prospectDetailQueryKey,
  prospectHeaderQueryKey,
  prospectDossierQueryKey,
  prospectEnrichmentJobsQueryKey,
}

export { fetchProspect }
