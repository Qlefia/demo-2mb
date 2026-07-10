import 'server-only'

import type { EnrichmentAccountContext, EnrichmentMergeInput } from '@/lib/enrichment/types'
import { enrichApollo } from '@/lib/enrichment/providers/apollo'
import { enrichBrowseAi } from '@/lib/enrichment/providers/browseai'
import { enrichNewsApi } from '@/lib/enrichment/providers/news'
import { enrichWayback } from '@/lib/enrichment/providers/wayback'

/**
 * Fan-out enrichment reads (cache-backed). Does not write jobs or dossier —
 * used for AI grounding / generate-dossier.
 */
export async function collectEnrichmentMergeInput(
  ctx: EnrichmentAccountContext,
): Promise<EnrichmentMergeInput> {
  const [apollo, browseAi, newsapi, wayback] = await Promise.all([
    enrichApollo(ctx),
    enrichBrowseAi(ctx),
    enrichNewsApi(ctx),
    enrichWayback(ctx),
  ])
  return { apollo, browseAi, newsapi, wayback }
}
