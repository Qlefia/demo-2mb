import { NextRequest, NextResponse, after } from 'next/server'
import { z } from 'zod'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import { LOST_REASONS, PROSPECT_STAGES, TRIAGE_DECISIONS } from '@/lib/db/schema/enums'
import { canTransition, type PipelineRole } from '@/lib/pipeline/transitions'
import { getServiceClient } from '@/lib/supabase/service'
import { pickCrmRole, pickTerritory } from '@/lib/auth/roles'
import { deriveSeatStatus } from '@/lib/team/seatService'
import { runProspectEnrichment } from '@/lib/enrichment/orchestrator'
import { withUserRls } from '@/lib/db/rls'
import { handoffHasSideEffects, runDossierHandoffInTx } from '@/lib/pipeline/dossierHandoff'
import { postDossierHandoffSlack } from '@/lib/integrations/slackNotify'
import {
  assertProspectAccess,
  loadDossierStatusForProspect,
  loadProspectForUser,
  promoteDossierToReadyIfNeeded,
} from '@/lib/prospects/serverData'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const idSchema = z.string().uuid()

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params
  const parsedId = idSchema.safeParse(id)
  if (!parsedId.success) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }

  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  try {
    const prospect = await loadProspectForUser(auth.supabase, parsedId.data)
    if (!prospect) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    return NextResponse.json({ prospect })
  } catch (err) {
    console.error('[api/prospects/:id GET] query failed', err)
    return NextResponse.json({ error: 'query_failed' }, { status: 500 })
  }
}

const patchSchema = z
  .object({
    stage: z.enum(PROSPECT_STAGES).optional(),
    priority: z.number().int().min(1).max(5).optional(),
    lostReason: z.enum(LOST_REASONS).nullable().optional(),
    triageDecision: z.enum(TRIAGE_DECISIONS).optional(),
    ownerId: z.string().uuid().nullable().optional(),
    primaryContactId: z.string().uuid().nullable().optional(),
    suggestedPlaybookId: z.string().uuid().nullable().optional(),
    quickNote: z.string().max(10000).nullable().optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: 'no_changes' })

function pickRole(value: unknown): PipelineRole {
  if (
    value === 'founder' ||
    value === 'ops' ||
    value === 'admin' ||
    value === 'sales_de' ||
    value === 'sales_uk'
  ) {
    return value
  }
  return null
}

const TRIAGE_ACTOR_ROLES = new Set<PipelineRole>(['founder', 'ops', 'admin'])

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params
  const parsedId = idSchema.safeParse(id)
  if (!parsedId.success) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }

  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth
  const { user } = auth

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
  const patch = parsed.data
  const role = pickRole((user.app_metadata ?? {}).role)

  // ownerId validation needs Admin-API access. We do it once, up-front,
  // outside the DB write so a bad owner returns a clean 422 with no half-done
  // changes.
  let ownerRole: PipelineRole | null = null
  let ownerTerritory: string | null = null
  if (patch.ownerId !== undefined && patch.ownerId !== null) {
    const service = getServiceClient()
    const { data: ownerRes, error: ownerErr } = await service.auth.admin.getUserById(patch.ownerId)
    if (ownerErr || !ownerRes.user) {
      return NextResponse.json({ error: 'invalid_owner', reason: 'unknown_user' }, { status: 422 })
    }
    if (deriveSeatStatus(ownerRes.user) !== 'active') {
      return NextResponse.json({ error: 'invalid_owner', reason: 'inactive' }, { status: 422 })
    }
    const resolvedRole = pickCrmRole((ownerRes.user.app_metadata ?? {}).role)
    if (!resolvedRole || resolvedRole === 'admin') {
      return NextResponse.json({ error: 'invalid_owner', reason: 'role' }, { status: 422 })
    }
    ownerRole = resolvedRole
    ownerTerritory = pickTerritory((ownerRes.user.app_metadata ?? {}).territory)
  }

  try {
    const access = await assertProspectAccess(auth.supabase, parsedId.data)
    if (!access) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    const current = access.current

    if (patch.ownerId !== undefined && patch.ownerId !== null) {
      if (
        (ownerRole === 'sales_de' || ownerRole === 'sales_uk') &&
        ownerTerritory !== current.territory
      ) {
        return NextResponse.json(
          { error: 'invalid_owner', reason: 'territory_mismatch' },
          { status: 422 },
        )
      }
    }

    let enrichAfterCommit = false
    if (patch.stage && patch.stage !== current.stage) {
      if (
        current.stage === 'new' &&
        (patch.stage === 'triaged' || patch.stage === 'lost') &&
        !TRIAGE_ACTOR_ROLES.has(role)
      ) {
        return NextResponse.json(
          { error: 'forbidden', reason: 'triage_requires_ops' },
          { status: 403 },
        )
      }

      if (current.stage === 'new' && patch.stage === 'triaged') {
        const decision = patch.triageDecision ?? 'accept'
        if (decision !== 'accept') {
          return NextResponse.json(
            { error: 'invalid_triage', reason: 'accept_decision_required' },
            { status: 422 },
          )
        }
      }

      if (current.stage === 'new' && patch.stage === 'lost') {
        const decision = patch.triageDecision ?? 'reject'
        if (decision !== 'reject') {
          return NextResponse.json(
            { error: 'invalid_triage', reason: 'reject_decision_required' },
            { status: 422 },
          )
        }
        if (patch.lostReason == null) {
          return NextResponse.json(
            { error: 'invalid_triage', reason: 'lost_reason_required' },
            { status: 422 },
          )
        }
      }

      let dossierStatus =
        patch.stage === 'dossier_ready'
          ? await loadDossierStatusForProspect(auth.supabase, parsedId.data)
          : null

      const privilegedStage =
        role === 'founder' || role === 'ops' || role === 'admin'

      if (
        patch.stage === 'dossier_ready' &&
        dossierStatus !== 'ready' &&
        privilegedStage
      ) {
        dossierStatus = await promoteDossierToReadyIfNeeded(
          auth.supabase,
          parsedId.data,
          user.id,
        )
      }

      const verdict = canTransition({
        role,
        fromStage: current.stage as never,
        toStage: patch.stage,
        dossierStatus,
      })
      if (!verdict.ok) {
        return NextResponse.json(
          {
            error: 'invalid_transition',
            reason: verdict.reasonKey,
            fromStage: current.stage,
            toStage: patch.stage,
          },
          { status: 422 },
        )
      }

      if (current.stage === 'triaged' && patch.stage === 'enriching') {
        enrichAfterCommit = true
      }
    }

    const updateValues: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (patch.stage !== undefined) updateValues.stage = patch.stage
    if (patch.priority !== undefined) updateValues.priority = patch.priority
    if (patch.lostReason !== undefined) updateValues.lost_reason = patch.lostReason
    if (patch.ownerId !== undefined) updateValues.owner_id = patch.ownerId

    if (patch.primaryContactId !== undefined) {
      if (patch.primaryContactId === null) {
        updateValues.primary_contact_id = null
      } else {
        const { data: contactRow, error: contactErr } = await auth.supabase
          .from('contacts')
          .select('id, account_id')
          .eq('id', patch.primaryContactId)
          .eq('workspace_id', access.workspaceId)
          .maybeSingle()
        if (contactErr || !contactRow || contactRow.account_id !== access.accountId) {
          return NextResponse.json(
            { error: 'invalid_primary_contact', reason: 'not_linked' },
            { status: 422 },
          )
        }
        updateValues.primary_contact_id = patch.primaryContactId
      }
    }

    if (patch.suggestedPlaybookId !== undefined) {
      if (patch.suggestedPlaybookId === null) {
        updateValues.suggested_playbook_id = null
      } else {
        const { data: playbookRow, error: playbookErr } = await auth.supabase
          .from('playbooks')
          .select('id')
          .eq('id', patch.suggestedPlaybookId)
          .eq('workspace_id', access.workspaceId)
          .maybeSingle()
        if (playbookErr || !playbookRow) {
          return NextResponse.json(
            { error: 'invalid_playbook', reason: 'not_found' },
            { status: 422 },
          )
        }
        updateValues.suggested_playbook_id = patch.suggestedPlaybookId
      }
    }

    if (patch.quickNote !== undefined) {
      updateValues.quick_note = patch.quickNote
    }

    if (patch.stage !== undefined && patch.stage !== current.stage) {
      if (current.stage === 'new' && patch.stage === 'triaged') {
        updateValues.triage_decision = patch.triageDecision ?? 'accept'
      } else if (current.stage === 'new' && patch.stage === 'lost') {
        updateValues.triage_decision = patch.triageDecision ?? 'reject'
      }
    }

    const { error: updateError } = await auth.supabase
      .from('prospects')
      .update(updateValues)
      .eq('id', parsedId.data)
      .eq('workspace_id', access.workspaceId)
    if (updateError) {
      console.error('[api/prospects/:id PATCH] update failed', updateError)
      return NextResponse.json({ error: 'update_failed' }, { status: 500 })
    }

    let handoff = null
    if (patch.stage === 'dossier_ready' && patch.stage !== current.stage) {
      try {
        handoff = await withUserRls(auth.session.access_token, (tx) =>
          runDossierHandoffInTx(tx, parsedId.data, user.id),
        )
        if (handoff && handoffHasSideEffects(handoff)) {
          after(() => {
            void postDossierHandoffSlack({
              accountName: handoff!.accountName,
              territory: handoff!.territory,
              prospectId: parsedId.data,
              assigneeName: handoff!.assigneeName,
              taskCreated: handoff!.taskCreated,
            })
          })
        }
      } catch (handoffErr) {
        console.error('[api/prospects/:id PATCH] handoff failed', handoffErr)
      }
    }

    if (enrichAfterCommit) {
      after(() => {
        void runProspectEnrichment(parsedId.data)
      })
    }

    const updated = await loadProspectForUser(auth.supabase, parsedId.data)
    return NextResponse.json({ ok: true, prospect: updated, handoff })
  } catch (err) {
    console.error('[api/prospects/:id PATCH] failed', err)
    return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  }
}
