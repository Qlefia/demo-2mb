import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'
import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { withUserRls } from '@/lib/db/rls'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import {
  activities,
  prospects,
  proposals,
  proposalShareTokens,
} from '@/lib/db/schema'
import { proposalVersions } from '@/lib/db/schema/proposalVersions'
import { validatePublishReady } from '@/lib/proposals/mergeFields'
import { mergeDraftOptionsFromProposalRow, mergedDraftBlocks } from '@/lib/proposals/server/mergedDraft'
import { snapshotPayload } from '@/lib/proposals/versionPayload'
import { proposalRowToJson } from '@/lib/proposals/proposalDto'
import { fetchProspectMergeContext } from '@/lib/proposals/mergeContext'
import { shareLinkExpiresAtFromStudioGeneral } from '@/lib/proposals/shareLinkExpiry'
import { markProjectOfferSent } from '@/lib/client-projects/service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const idSchema = z.string().uuid()

interface RouteContext {
  params: Promise<{ id: string; proposalId: string }>
}

function newOpaqueToken(): string {
  return randomBytes(32).toString('base64url')
}

const publishBodySchema = z
  .object({
    advanceStage: z.boolean().optional(),
  })
  .strict()

export async function POST(request: NextRequest, ctx: RouteContext) {
  const { id, proposalId } = await ctx.params
  const parsedProspect = idSchema.safeParse(id)
  const parsedProposal = idSchema.safeParse(proposalId)
  if (!parsedProspect.success || !parsedProposal.success) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  let raw: unknown = {}
  try {
    raw = await request.json()
  } catch {
    raw = {}
  }
  const parsed = publishBodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', issues: parsed.error.issues },
      { status: 400 },
    )
  }
  const advanceStage = parsed.data.advanceStage === true

  try {
    const result = await withUserRls(auth.session.access_token, async (tx) => {
      const [existing] = await tx
        .select()
        .from(proposals)
        .where(
          and(
            eq(proposals.id, parsedProposal.data),
            eq(proposals.prospectId, parsedProspect.data),
          ),
        )
        .limit(1)

      if (!existing) return { code: 'not_found' as const }

      const mergeCtx = await fetchProspectMergeContext(tx, parsedProspect.data)
      const shareExpiresAt = shareLinkExpiresAtFromStudioGeneral(mergeCtx?.studioGeneral ?? null)

      const mergedBlocks = await mergedDraftBlocks(
        tx,
        parsedProspect.data,
        existing.blocks,
        mergeDraftOptionsFromProposalRow(existing),
      )
      const validation = validatePublishReady(mergedBlocks)
      if (!validation.ok) {
        return {
          code: 'validation' as const,
          validation,
        }
      }

      const nextVersion = existing.version + 1

      const [versionRow] = await tx
        .insert(proposalVersions)
        .values({
          proposalId: existing.id,
          version: nextVersion,
          blocksDiff: snapshotPayload(mergedBlocks) as unknown as Record<string, unknown>,
          generatedBy: auth.user.id,
        })
        .returning()

      const [updatedProposal] = await tx
        .update(proposals)
        .set({
          status: 'published',
          publishedVersionId: versionRow.id,
          version: nextVersion,
        })
        .where(eq(proposals.id, existing.id))
        .returning()

      const [existingTok] = await tx
        .select({ id: proposalShareTokens.id, token: proposalShareTokens.token })
        .from(proposalShareTokens)
        .where(
          and(
            eq(proposalShareTokens.proposalId, existing.id),
            isNull(proposalShareTokens.revokedAt),
          ),
        )
        .limit(1)

      let tokenStr: string
      if (!existingTok) {
        tokenStr = newOpaqueToken()
        await tx.insert(proposalShareTokens).values({
          proposalId: existing.id,
          token: tokenStr,
          publishedVersionId: versionRow.id,
          expiresAt: shareExpiresAt,
        })
      } else {
        tokenStr = existingTok.token
        await tx
          .update(proposalShareTokens)
          .set({
            publishedVersionId: versionRow.id,
            expiresAt: shareExpiresAt,
          })
          .where(eq(proposalShareTokens.id, existingTok.id))
      }

      if (advanceStage) {
        await tx
          .update(prospects)
          .set({ stage: 'proposal_sent' })
          .where(eq(prospects.id, parsedProspect.data))
      }

      if (existing.documentKind === 'offer' && existing.projectId) {
        await markProjectOfferSent(tx, existing.projectId)
      }

      await tx.insert(activities).values({
        prospectId: parsedProspect.data,
        actorId: auth.user.id,
        type: 'audit',
        payload: {
          kind: existing.documentKind === 'offer' ? 'offer_published' : 'proposal_published',
          proposalId: existing.id,
          documentKind: existing.documentKind,
          version: nextVersion,
          advanceStage,
        } as unknown as Record<string, unknown>,
      })

      return {
        code: 'ok' as const,
        proposal: updatedProposal,
        share: {
          token: tokenStr,
          publicPath: `/p/${tokenStr}`,
        },
      }
    })

    if (result.code === 'not_found') {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    if (result.code === 'validation') {
      const v = result.validation
      return NextResponse.json(
        {
          error: 'publish_validation_failed',
          code: v.code,
          message: v.message,
        },
        { status: 422 },
      )
    }

    return NextResponse.json({
      proposal: proposalRowToJson(result.proposal),
      share: result.share,
    })
  } catch (err) {
    console.error('[api/.../publish POST] failed', err)
    return NextResponse.json({ error: 'publish_failed' }, { status: 500 })
  }
}
