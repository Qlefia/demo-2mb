import { NextRequest, NextResponse } from 'next/server'
import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { withUserRls } from '@/lib/db/rls'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import { prospects, proposals, proposalShareTokens } from '@/lib/db/schema'
import { proposalVersions } from '@/lib/db/schema/proposalVersions'
import { parseProposalBlocks } from '@/lib/proposals/blockSchema'
import { mergeDraftOptionsFromProposalRow, mergedDraftBlocks } from '@/lib/proposals/server/mergedDraft'
import { snapshotPayload } from '@/lib/proposals/versionPayload'
import { proposalRowToJson } from '@/lib/proposals/proposalDto'
import { buildMergePackageFromContext } from '@/lib/proposals/mergeFields'
import { fetchProspectMergeContext } from '@/lib/proposals/mergeContext'
import { buildStudioProposalDefaults } from '@/lib/proposals/studioProposalDefaults'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const idSchema = z.string().uuid()

interface RouteContext {
  params: Promise<{ id: string; proposalId: string }>
}

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { id, proposalId } = await ctx.params
  const parsedProspect = idSchema.safeParse(id)
  const parsedProposal = idSchema.safeParse(proposalId)
  if (!parsedProspect.success || !parsedProposal.success) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  try {
    const result = await withUserRls(auth.session.access_token, async (tx) => {
      const [row] = await tx
        .select()
        .from(proposals)
        .where(
          and(
            eq(proposals.id, parsedProposal.data),
            eq(proposals.prospectId, parsedProspect.data),
          ),
        )
        .limit(1)

      if (!row) return null

      let mergedBlocks = null as Awaited<ReturnType<typeof mergedDraftBlocks>> | null
      try {
        mergedBlocks = await mergedDraftBlocks(
          tx,
          parsedProspect.data,
          row.blocks,
          mergeDraftOptionsFromProposalRow(row),
        )
      } catch {
        mergedBlocks = null
      }

      const [tok] = await tx
        .select({
          token: proposalShareTokens.token,
          expiresAt: proposalShareTokens.expiresAt,
          publishedVersionId: proposalShareTokens.publishedVersionId,
        })
        .from(proposalShareTokens)
        .where(
          and(
            eq(proposalShareTokens.proposalId, row.id),
            isNull(proposalShareTokens.revokedAt),
          ),
        )
        .limit(1)

      const share =
        tok && row.status === 'published'
          ? {
              token: tok.token,
              publicPath: `/p/${tok.token}`,
              expiresAt:
                tok.expiresAt != null
                  ? tok.expiresAt instanceof Date
                    ? tok.expiresAt.toISOString()
                    : new Date(tok.expiresAt as unknown as string).toISOString()
                  : null,
            }
          : null

      const mergeCtx = await fetchProspectMergeContext(tx, parsedProspect.data)
      const mergePackage = mergeCtx
        ? buildMergePackageFromContext(mergeCtx, mergeDraftOptionsFromProposalRow(row))
        : null
      const studioDefaults = mergeCtx
        ? buildStudioProposalDefaults(
            mergeCtx.studioGeneral,
            row.language === 'de' ? 'de' : 'en',
          )
        : null

      return {
        proposal: proposalRowToJson(row),
        mergedBlocks,
        share,
        mergePackage,
        studioDefaults,
      }
    })

    if (result === null) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    return NextResponse.json(result)
  } catch (err) {
    console.error('[api/prospects/:id/proposals/:proposalId GET] failed', err)
    return NextResponse.json({ error: 'query_failed' }, { status: 500 })
  }
}

const patchSchema = z
  .object({
    title: z.string().min(1).max(300).optional(),
    blocks: z.array(z.unknown()).optional(),
    language: z.enum(['de', 'en']).optional(),
  })
  .strict()
  .refine((d) => d.title !== undefined || d.blocks !== undefined || d.language !== undefined, {
    message: 'empty_patch',
  })

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  const { id, proposalId } = await ctx.params
  const parsedProspect = idSchema.safeParse(id)
  const parsedProposal = idSchema.safeParse(proposalId)
  if (!parsedProspect.success || !parsedProposal.success) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const parsed = patchSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', issues: parsed.error.issues },
      { status: 400 },
    )
  }
  const body = parsed.data

  let parsedBlocks: ReturnType<typeof parseProposalBlocks> | undefined
  if (body.blocks !== undefined) {
    try {
      parsedBlocks = parseProposalBlocks(body.blocks)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'invalid_blocks'
      return NextResponse.json({ error: 'invalid_blocks', message: msg }, { status: 400 })
    }
  }

  try {
    const updated = await withUserRls(auth.session.access_token, async (tx) => {
      const ok = await tx
        .select({ id: prospects.id })
        .from(prospects)
        .where(eq(prospects.id, parsedProspect.data))
        .limit(1)
      if (ok.length === 0) return { code: 'not_found' as const }

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

      const now = new Date()

      /** Title/language-only — no new snapshot row (rename / locale tweak). */
      if (body.blocks === undefined) {
        const [row] = await tx
          .update(proposals)
          .set({
            ...(body.title !== undefined ? { title: body.title.trim() } : {}),
            ...(body.language !== undefined ? { language: body.language } : {}),
            updatedAt: now,
          })
          .where(eq(proposals.id, existing.id))
          .returning()

        let mergedBlocks = null as Awaited<ReturnType<typeof mergedDraftBlocks>> | null
        try {
          mergedBlocks = await mergedDraftBlocks(
            tx,
            parsedProspect.data,
            row.blocks,
            mergeDraftOptionsFromProposalRow(row),
          )
        } catch {
          mergedBlocks = null
        }

        return { code: 'ok' as const, row, mergedBlocks }
      }

      const nextVersion = existing.version + 1
      const nextBlocks = parsedBlocks ?? parseProposalBlocks(existing.blocks)

      const [row] = await tx
        .update(proposals)
        .set({
          title: body.title?.trim() ?? existing.title,
          blocks: nextBlocks as unknown as typeof existing.blocks,
          language: body.language ?? existing.language,
          version: nextVersion,
          updatedAt: now,
        })
        .where(eq(proposals.id, existing.id))
        .returning()

      await tx.insert(proposalVersions).values({
        proposalId: existing.id,
        version: nextVersion,
        blocksDiff: snapshotPayload(nextBlocks) as unknown as Record<string, unknown>,
        generatedBy: auth.user.id,
      })

      let mergedBlocks = null as Awaited<ReturnType<typeof mergedDraftBlocks>> | null
      try {
        mergedBlocks = await mergedDraftBlocks(
          tx,
          parsedProspect.data,
          row.blocks,
          mergeDraftOptionsFromProposalRow(row),
        )
      } catch {
        mergedBlocks = null
      }

      return { code: 'ok' as const, row, mergedBlocks }
    })

    if (updated.code === 'not_found') {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    return NextResponse.json({
      proposal: proposalRowToJson(updated.row),
      mergedBlocks: updated.mergedBlocks,
    })
  } catch (err) {
    console.error('[api/prospects/:id/proposals/:proposalId PATCH] failed', err)
    return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const { id, proposalId } = await ctx.params
  const parsedProspect = idSchema.safeParse(id)
  const parsedProposal = idSchema.safeParse(proposalId)
  if (!parsedProspect.success || !parsedProposal.success) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  try {
    const deleted = await withUserRls(auth.session.access_token, async (tx) => {
      const res = await tx
        .delete(proposals)
        .where(
          and(
            eq(proposals.id, parsedProposal.data),
            eq(proposals.prospectId, parsedProspect.data),
          ),
        )
        .returning({ id: proposals.id })
      return res.length > 0
    })

    if (!deleted) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/prospects/:id/proposals/:proposalId DELETE] failed', err)
    return NextResponse.json({ error: 'delete_failed' }, { status: 500 })
  }
}
