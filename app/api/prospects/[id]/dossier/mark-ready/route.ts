import { NextResponse, after } from 'next/server'
import { z } from 'zod'
import { inArray } from 'drizzle-orm'
import { withUserRls } from '@/lib/db/rls'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import { activities, contacts as contactsTable } from '@/lib/db/schema'
import {
  loadDossierByProspect,
  setDossierStatus,
} from '@/lib/dossiers/service'
import { validateDossier } from '@/lib/dossiers/validate'
import { handoffHasSideEffects, runDossierHandoffInTx } from '@/lib/pipeline/dossierHandoff'
import { postDossierHandoffSlack } from '@/lib/integrations/slackNotify'
import type { DecisionMakersSection } from '@/lib/dossiers/schema'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const idSchema = z.string().uuid()

interface RouteContext {
  params: Promise<{ id: string }>
}

async function hasContactMethod(
  tx: Parameters<Parameters<typeof withUserRls>[1]>[0],
  decisionMakers: DecisionMakersSection | undefined,
): Promise<boolean | 'pending'> {
  // Phase 2.1: contacts CRUD doesn't ship until Phase 2.2 — surface as 'pending'
  // so MarkReady stays blocked but the failure shows as soft "wired in 2.2".
  const contactIds = decisionMakers?.contactIds ?? []
  if (contactIds.length === 0) return 'pending'

  const rows = await tx
    .select({
      id: contactsTable.id,
      email: contactsTable.email,
      linkedinUrl: contactsTable.linkedinUrl,
    })
    .from(contactsTable)
    .where(inArray(contactsTable.id, contactIds))

  return rows.some((r) => Boolean(r.email) || Boolean(r.linkedinUrl))
}

export async function POST(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params
  const parsedId = idSchema.safeParse(id)
  if (!parsedId.success) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }

  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth
  const { user, session } = auth

  try {
    const outcome = await withUserRls(session.access_token, async (tx) => {
      const dossier = await loadDossierByProspect(tx, parsedId.data)
      if (!dossier) {
        return { ok: false as const, status: 404, body: { error: 'dossier_missing' } }
      }
      if (dossier.status === 'ready') {
        return {
          ok: false as const,
          status: 409,
          body: { error: 'already_ready', status: dossier.status },
        }
      }

      const contactMethod = await hasContactMethod(tx, dossier.sections.decision_makers)
      const validation = validateDossier(dossier.sections, {
        hasContactMethod: contactMethod,
        mode: 'manual',
      })
      if (!validation.passed) {
        return {
          ok: false as const,
          status: 422,
          body: {
            error: 'validation_failed',
            failures: validation.failures,
            checks: validation.checks,
          },
        }
      }

      const updated = await setDossierStatus(tx, dossier.id, {
        status: 'ready',
        reviewedBy: user.id,
        reviewedAt: new Date(),
      })

      await tx.insert(activities).values({
        prospectId: parsedId.data,
        actorId: user.id,
        type: 'dossier_delivered',
        payload: {
          dossierId: dossier.id,
          version: updated?.version ?? dossier.version,
          checksPassed: validation.checks.filter((c) => c.status === 'passed').length,
          checksTotal: validation.checks.length,
        },
      })

      const handoff = await runDossierHandoffInTx(tx, parsedId.data, user.id)

      return { ok: true as const, dossier: updated, handoff }
    })

    if (!outcome.ok) {
      return NextResponse.json(outcome.body, { status: outcome.status })
    }

    if (outcome.handoff && handoffHasSideEffects(outcome.handoff)) {
      after(() => {
        void postDossierHandoffSlack({
          accountName: outcome.handoff!.accountName,
          territory: outcome.handoff!.territory,
          prospectId: parsedId.data,
          assigneeName: outcome.handoff!.assigneeName,
          taskCreated: outcome.handoff!.taskCreated,
        })
      })
    }

    return NextResponse.json({ dossier: outcome.dossier, handoff: outcome.handoff ?? null })
  } catch (err) {
    console.error('[api/prospects/:id/dossier/mark-ready POST] failed', err)
    return NextResponse.json({ error: 'mark_ready_failed' }, { status: 500 })
  }
}
