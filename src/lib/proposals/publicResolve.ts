import 'server-only'

import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import {
  proposalShareTokens,
  proposalVersions,
  proposals,
} from '@/lib/db/schema'
import { parseSnapshotFromDiff } from '@/lib/proposals/versionPayload'

export type ResolvedPublicProposal =
  | {
      ok: true
      proposalTitle: string
      proposalLanguage: 'de' | 'en'
      blocks: ReturnType<typeof parseSnapshotFromDiff>
    }
  | { ok: false; reason: 'not_found' | 'revoked' | 'expired' | 'not_published' }

/**
 * Resolve a share token for the public `/p/[token]` route.
 * Uses the Postgres session pool (privileged connection — bypasses RLS).
 * Must validate token state explicitly.
 */
export async function resolveShareToken(token: string): Promise<ResolvedPublicProposal> {
  const trimmed = token.trim()
  if (!trimmed || trimmed.length > 256) {
    return { ok: false, reason: 'not_found' }
  }

  const [row] = await db
    .select({
      revokedAt: proposalShareTokens.revokedAt,
      expiresAt: proposalShareTokens.expiresAt,
      publishedVersionId: proposalShareTokens.publishedVersionId,
      proposalId: proposalShareTokens.proposalId,
    })
    .from(proposalShareTokens)
    .where(eq(proposalShareTokens.token, trimmed))
    .limit(1)

  if (!row || !row.publishedVersionId) {
    return { ok: false, reason: 'not_found' }
  }

  if (row.revokedAt != null) {
    return { ok: false, reason: 'revoked' }
  }

  if (row.expiresAt != null && row.expiresAt.getTime() < Date.now()) {
    return { ok: false, reason: 'expired' }
  }

  const [proposalRow] = await db
    .select({
      title: proposals.title,
      language: proposals.language,
      status: proposals.status,
      publishedVersionId: proposals.publishedVersionId,
    })
    .from(proposals)
    .where(eq(proposals.id, row.proposalId))
    .limit(1)

  if (!proposalRow || proposalRow.status !== 'published') {
    return { ok: false, reason: 'not_published' }
  }

  if (proposalRow.publishedVersionId !== row.publishedVersionId) {
    return { ok: false, reason: 'not_found' }
  }

  const [versionRow] = await db
    .select({ blocksDiff: proposalVersions.blocksDiff })
    .from(proposalVersions)
    .where(eq(proposalVersions.id, row.publishedVersionId))
    .limit(1)

  if (!versionRow) {
    return { ok: false, reason: 'not_found' }
  }

  try {
    const blocks = parseSnapshotFromDiff(versionRow.blocksDiff)
    return {
      ok: true,
      proposalTitle: proposalRow.title,
      proposalLanguage: proposalRow.language as 'de' | 'en',
      blocks,
    }
  } catch {
    return { ok: false, reason: 'not_found' }
  }
}
