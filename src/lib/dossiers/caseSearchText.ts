import type { EnrichmentMergeInput } from '@/lib/enrichment/types'

/** Text used for embedding when retrieving comparable cases (Phase 6). */
export function buildCaseSearchText(input: {
  accountName: string
  website: string | null
  enrichment: EnrichmentMergeInput
}): string {
  const parts = [
    input.accountName,
    input.website ?? '',
    typeof input.enrichment.apollo === 'object'
      ? JSON.stringify(input.enrichment.apollo).slice(0, 4000)
      : '',
    typeof input.enrichment.browseAi === 'object'
      ? JSON.stringify(input.enrichment.browseAi).slice(0, 2500)
      : '',
    typeof input.enrichment.newsapi === 'object'
      ? JSON.stringify(input.enrichment.newsapi).slice(0, 2500)
      : '',
    typeof input.enrichment.wayback === 'object'
      ? JSON.stringify(input.enrichment.wayback).slice(0, 1500)
      : '',
  ]
  return parts.filter(Boolean).join('\n').slice(0, 8000)
}
