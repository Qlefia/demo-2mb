import type { EnrichmentMergeInput } from '@/lib/enrichment/types'

export { extractAllowedUrlHints } from './groundingAllowlist'

/** Normalized bundle for prompts + URL allowlists for anti-fabrication (Phase 5). */
export interface GroundingPack {
  prospectId: string
  accountId: string
  accountName: string
  website: string | null
  enrichment: EnrichmentMergeInput
  /** Phase 6 will fill; Phase 5 sends empty array */
  topCases: unknown[]
  /** Serialized envelope for strippers */
  serializedForAllowlist: string
}

export function buildGroundingPack(input: {
  prospectId: string
  accountId: string
  accountName: string
  website: string | null
  enrichment: EnrichmentMergeInput
  topCases?: unknown[]
}): GroundingPack {
  const topCases = input.topCases ?? []
  const envelope = {
    accountName: input.accountName,
    website: input.website,
    enrichment: input.enrichment,
    topCases,
  }
  return {
    prospectId: input.prospectId,
    accountId: input.accountId,
    accountName: input.accountName,
    website: input.website,
    enrichment: input.enrichment,
    topCases,
    serializedForAllowlist: JSON.stringify(envelope),
  }
}
