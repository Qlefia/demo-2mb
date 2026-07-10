import { NextRequest, NextResponse } from 'next/server'
import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { withUserRls } from '@/lib/db/rls'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import { activities, prospects, proposals, proposalShareTokens } from '@/lib/db/schema'
import { proposalRowToJson } from '@/lib/proposals/proposalDto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const idSchema = z.string().uuid()

interface RouteContext {
  params: Promise<{ id: string; proposalId: string }>
}

export async function POST(_request: NextRequest, ctx: RouteContext) {
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
      if (existing.status === 'draft') {
        return { code: 'already_draft' as const, proposal: existing }
      }

      const now = new Date()

      const [updated] = await tx
        .update(proposals)
        .set({ status: 'draft', updatedAt: now })
        .where(eq(proposals.id, existing.id))
        .returning()

      await tx
        .update(proposalShareTokens)
        .set({ revokedAt: now })
        .where(
          and(
            eq(proposalShareTokens.proposalId, existing.id),
            isNull(proposalShareTokens.revokedAt),
          ),
        )

      await tx.insert(activities).values({
        prospectId: parsedProspect.data,
        actorId: auth.user.id,
        type: 'audit',
        payload: {
          kind: 'proposal_unpublished',
          proposalId: existing.id,
        } as unknown as Record<string, unknown>,
      })

      return { code: 'ok' as const, proposal: updated }
    })

    if (result.code === 'not_found') {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      proposal: proposalRowToJson(result.proposal),
      alreadyDraft: result.code === 'already_draft',
    })
  } catch (err) {
    console.error('[api/.../unpublish POST] failed', err)
    return NextResponse.json({ error: 'unpublish_failed' }, { status: 500 })
  }
}
