import { NextResponse } from 'next/server'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { withUserRls } from '@/lib/db/rls'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import { activities, prospects } from '@/lib/db/schema'
import { stageRank } from '@/lib/pipeline/transitions'
import {
  loadDossierByProspect,
  setDossierStatus,
} from '@/lib/dossiers/service'
import { getRoleFromUser } from '@/lib/auth/roles'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const idSchema = z.string().uuid()

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * Founder/ops-only revert: ready → in_review. Allowed only if the prospect's
 * stage hasn't already moved past `dossier_ready` — once the prospect is in
 * `1st_call+`, the dossier was already used downstream and the audit trail
 * shouldn't pretend otherwise (Sales saw it).
 */
const ALLOWED_ROLES = new Set(['founder', 'ops'])

export async function POST(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params
  const parsedId = idSchema.safeParse(id)
  if (!parsedId.success) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }

  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth
  const { user, session } = auth

  const role = getRoleFromUser(user)
  if (!role || !ALLOWED_ROLES.has(role)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  try {
    const outcome = await withUserRls(session.access_token, async (tx) => {
      const dossier = await loadDossierByProspect(tx, parsedId.data)
      if (!dossier) {
        return { ok: false as const, status: 404, body: { error: 'dossier_missing' } }
      }
      if (dossier.status !== 'ready') {
        return {
          ok: false as const,
          status: 409,
          body: { error: 'not_ready', status: dossier.status },
        }
      }

      const prospectRow = await tx
        .select({ stage: prospects.stage })
        .from(prospects)
        .where(eq(prospects.id, parsedId.data))
        .limit(1)
      const stage = prospectRow[0]?.stage
      if (!stage) {
        return { ok: false as const, status: 404, body: { error: 'prospect_missing' } }
      }
      if (stageRank(stage) > stageRank('dossier_ready')) {
        return {
          ok: false as const,
          status: 422,
          body: {
            error: 'stage_advanced',
            stage,
          },
        }
      }

      const updated = await setDossierStatus(tx, dossier.id, {
        status: 'in_review',
        reviewedBy: null,
        reviewedAt: null,
      })

      await tx.insert(activities).values({
        prospectId: parsedId.data,
        actorId: user.id,
        type: 'note',
        payload: {
          system: true,
          kind: 'dossier_reopened',
          dossierId: dossier.id,
          fromVersion: dossier.version,
        },
      })

      return { ok: true as const, dossier: updated }
    })

    if (!outcome.ok) {
      return NextResponse.json(outcome.body, { status: outcome.status })
    }
    return NextResponse.json({ dossier: outcome.dossier })
  } catch (err) {
    console.error('[api/prospects/:id/dossier/mark-in-review POST] failed', err)
    return NextResponse.json({ error: 'mark_in_review_failed' }, { status: 500 })
  }
}
