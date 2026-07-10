import { asc, eq } from 'drizzle-orm'
import type { proposals } from '@/lib/db/schema'
import type { Database } from '@/lib/db/client'
import { serviceTags } from '@/lib/db/schema'
import type { ProposalBlock } from '@/lib/proposals/blockSchema'
import { parseProposalBlocks } from '@/lib/proposals/blockSchema'
import type { DeckLanguage } from '@/lib/proposals/deckLayout'
import {
  applyMergeToBlocks,
  buildMergePackageFromContext,
} from '@/lib/proposals/mergeFields'
import { applyStudioDefaultsToBlocks } from '@/lib/proposals/applyStudioDefaults'
import { fetchProspectMergeContext } from '@/lib/proposals/mergeContext'
import {
  buildStudioProposalDefaults,
  resolveProposalValidityDays,
} from '@/lib/proposals/studioProposalDefaults'
import { SERVICE_TAGS_AUTOFILL_COUNT } from '@/lib/proposals/proposalDefaults'

export type MergedDraftOptions = {
  language: DeckLanguage
  proposalMeta?: {
    issuedAt: Date | null
    validityDays: number | null
    projectName: string | null
  }
}

export function mergeDraftOptionsFromProposalRow(
  row: typeof proposals.$inferSelect,
): MergedDraftOptions {
  const issued = row.issuedAt
  let issuedAt: Date | null = null
  if (issued instanceof Date) issuedAt = issued
  else if (issued) issuedAt = new Date(issued as unknown as string)

  return {
    language: row.language === 'de' ? 'de' : 'en',
    proposalMeta: {
      issuedAt,
      validityDays: row.validityDays ?? 3,
      projectName: row.projectName,
    },
  }
}

async function applyDefaultServiceTags(
  tx: Database,
  blocks: ProposalBlock[],
  language: DeckLanguage,
): Promise<ProposalBlock[]> {
  let needsDefaults = false
  for (const b of blocks) {
    if (b.type === 'service_tags' && b.props.entries.length === 0) {
      needsDefaults = true
      break
    }
  }
  if (!needsDefaults) return blocks

  const rows = await tx
    .select({
      id: serviceTags.id,
      labelDe: serviceTags.labelDe,
      labelEn: serviceTags.labelEn,
    })
    .from(serviceTags)
    .where(eq(serviceTags.isActive, true))
    .orderBy(asc(serviceTags.sortOrder))
    .limit(SERVICE_TAGS_AUTOFILL_COUNT)

  const entries = rows.map((r) => ({
    sourceId: r.id,
    label: language === 'de' ? r.labelDe : r.labelEn,
  }))

  return blocks.map((b) => {
    if (b.type !== 'service_tags' || b.props.entries.length > 0) return b
    return {
      ...b,
      props: {
        ...b.props,
        entries,
      },
    }
  })
}

export async function mergedDraftBlocks(
  tx: Database,
  prospectId: string,
  draftBlocksJson: unknown,
  options?: MergedDraftOptions,
): Promise<ProposalBlock[]> {
  const ctx = await fetchProspectMergeContext(tx, prospectId)
  let blocks = parseProposalBlocks(draftBlocksJson)
  if (!ctx) return blocks

  const lang = options?.language ?? 'en'
  const studioDefaults = buildStudioProposalDefaults(ctx.studioGeneral, lang)
  const validityDays = resolveProposalValidityDays(
    options?.proposalMeta?.validityDays,
    studioDefaults,
  )
  const pkg = buildMergePackageFromContext(ctx, {
    language: lang,
    proposalMeta: {
      issuedAt: options?.proposalMeta?.issuedAt ?? null,
      validityDays,
      projectName: options?.proposalMeta?.projectName ?? null,
    },
  })
  blocks = applyMergeToBlocks(blocks, pkg)

  if (studioDefaults) {
    blocks = applyStudioDefaultsToBlocks(blocks, studioDefaults)
  }

  blocks = await applyDefaultServiceTags(tx, blocks, lang)
  return blocks
}
