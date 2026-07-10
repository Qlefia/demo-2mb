import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { buildUserDisplayMap } from '@/lib/prospects/serialize'
import type {
  DossierStatus,
  LostReason,
  Prospect,
  ProspectSource,
  ProspectStage,
  Territory,
  TriageDecision,
} from '@/features/prospects/types'

/**
 * Server-side data layer for the Prospects screen.
 *
 * Architecture (after 2026-05-22 incident — `GET /api/prospects 200 in 60s`):
 *
 * - **All reads go through PostgREST** via the supabase-js server client built
 *   from request cookies. This sidesteps the project-wide `postgres-js` pool
 *   (Drizzle) entirely. The pool was the actual culprit: in dev, requests
 *   served by the same pgbouncer transaction-mode pool would queue behind a
 *   single stuck connection and the second `/api/prospects` request would sit
 *   for the full client timeout. The Studio settings route only got away with
 *   it because it issues exactly one query per request.
 * - **RLS is enforced by Postgres**, not by app code: the supabase-js client
 *   carries the user's JWT in cookies, so PostgREST executes every query as
 *   `authenticated` with `request.jwt.claims` populated. Policies on
 *   `prospects`, `accounts`, `dossiers`, `triggers` already gate ops/founder/
 *   admin/sales access (see `supabase/migrations/20260429080100_rls_policies
 *   .sql`).
 * - **Tenant scoping** is still added explicitly with `.eq('workspace_id', …)`
 *   for defense-in-depth — RLS would refuse cross-tenant rows anyway but the
 *   explicit filter shrinks the result set early.
 *
 * Returns `null` when the user has no workspace they can access.
 */

interface RawProspectRow {
  id: string
  account_id: string
  owner_id: string | null
  created_by: string | null
  source: string
  territory: string
  stage: string
  priority: number
  triage_decision: string | null
  lost_reason: string | null
  suggested_playbook_id: string | null
  primary_contact_id: string | null
  quick_note: string | null
  created_at: string
  updated_at: string
  workspace_id: string
  accounts: { id: string; name: string; website: string | null } | null
  // PostgREST returns embedded one-to-one rows as arrays unless there is a
  // FK uniqueness constraint. We always pick `[0]`.
  dossiers: { status: DossierStatus | null }[]
}

interface RawTriggerRow {
  account_id: string
  payload: { text?: string; summary?: string } | null
  occurred_at: string
  type: string
}

function pickTriggerText(row: RawTriggerRow): string {
  return row.payload?.text ?? row.payload?.summary ?? row.type
}

function mapRow(
  row: RawProspectRow,
  triggers: Map<string, RawTriggerRow>,
  displayById: Record<string, string>,
): Prospect {
  const trigger = triggers.get(row.account_id) ?? null
  return {
    id: row.id,
    accountId: row.account_id,
    account: row.accounts
      ? { id: row.accounts.id, name: row.accounts.name, website: row.accounts.website }
      : { id: row.account_id, name: '', website: null },
    ownerId: row.owner_id,
    ownerLabel: row.owner_id ? (displayById[row.owner_id] ?? null) : null,
    createdById: row.created_by,
    createdByLabel: row.created_by ? (displayById[row.created_by] ?? null) : null,
    source: row.source as ProspectSource,
    territory: row.territory as Territory,
    stage: row.stage as ProspectStage,
    priority: row.priority,
    triageDecision: row.triage_decision as TriageDecision | null,
    lostReason: row.lost_reason as LostReason | null,
    suggestedPlaybookId: row.suggested_playbook_id,
    primaryContactId: row.primary_contact_id,
    quickNote: row.quick_note,
    latestTrigger: trigger
      ? { text: pickTriggerText(trigger), capturedAt: trigger.occurred_at }
      : null,
    dossierStatus: row.dossiers?.[0]?.status ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const PROSPECT_SELECT = `
  id, account_id, owner_id, created_by, source, territory, stage, priority,
  triage_decision, lost_reason, suggested_playbook_id, primary_contact_id, quick_note,
  created_at, updated_at,
  workspace_id,
  accounts:account_id (id, name, website),
  dossiers (status)
` as const

/**
 * Resolve the user's primary workspace via PostgREST.
 *
 * Reads `workspace_members` directly under the user's JWT. The
 * `workspace_members_self_read` policy (see migration
 * `20260522110000_workspace_members_self_read_no_recursion.sql`) gates this
 * to `user_id = auth.uid()`, so each user only sees their own membership rows
 * — exactly what's needed to pick a primary workspace.
 *
 * Prefer an `owner` membership, then any membership, newest workspace first.
 * Returns `null` when the user has no membership at all.
 */
export async function resolveWorkspaceId(
  supabase: SupabaseClient,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, workspaces!inner(id, created_at)')
    .order('created_at', { foreignTable: 'workspaces', ascending: false })
  if (error) {
    console.error('[prospects/serverData] resolveWorkspaceId failed', error)
    return null
  }
  if (!data || data.length === 0) return null

  const owned = data.find((m) => m.role === 'owner')
  return ((owned ?? data[0]).workspace_id as string) ?? null
}

async function loadLatestTriggers(
  supabase: SupabaseClient,
  workspaceId: string,
  accountIds: string[],
): Promise<Map<string, RawTriggerRow>> {
  if (accountIds.length === 0) return new Map()
  const { data, error } = await supabase
    .from('triggers')
    .select('account_id, payload, occurred_at, type')
    .eq('workspace_id', workspaceId)
    .in('account_id', accountIds)
    .order('occurred_at', { ascending: false })
  if (error) {
    console.error('[prospects/serverData] loadLatestTriggers failed', error)
    return new Map()
  }
  const map = new Map<string, RawTriggerRow>()
  for (const row of (data ?? []) as RawTriggerRow[]) {
    if (!map.has(row.account_id)) map.set(row.account_id, row)
  }
  return map
}

export async function loadProspectsForUser(
  supabase: SupabaseClient,
): Promise<Prospect[] | null> {
  const workspaceId = await resolveWorkspaceId(supabase)
  if (!workspaceId) return null

  const { data, error } = await supabase
    .from('prospects')
    .select(PROSPECT_SELECT)
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('[prospects/serverData] loadProspects failed', error)
    throw new Error('prospects_query_failed')
  }
  const baseRows = (data ?? []) as unknown as RawProspectRow[]
  if (baseRows.length === 0) return []

  const accountIds = Array.from(new Set(baseRows.map((r) => r.account_id)))
  const [triggers, displayById] = await Promise.all([
    loadLatestTriggers(supabase, workspaceId, accountIds),
    buildUserDisplayMap(),
  ])

  return baseRows.map((row) => mapRow(row, triggers, displayById))
}

export async function loadProspectForUser(
  supabase: SupabaseClient,
  prospectId: string,
): Promise<Prospect | null> {
  const workspaceId = await resolveWorkspaceId(supabase)
  if (!workspaceId) return null

  const { data, error } = await supabase
    .from('prospects')
    .select(PROSPECT_SELECT)
    .eq('workspace_id', workspaceId)
    .eq('id', prospectId)
    .limit(1)
    .maybeSingle()
  if (error) {
    console.error('[prospects/serverData] loadProspect failed', error)
    throw new Error('prospect_query_failed')
  }
  if (!data) return null

  const row = data as unknown as RawProspectRow
  const triggers = await loadLatestTriggers(supabase, workspaceId, [row.account_id])
  const displayById = await buildUserDisplayMap()
  return mapRow(row, triggers, displayById)
}

/**
 * Confirm the caller can mutate `prospectId` (it belongs to their workspace).
 * Returns the current row's stage / owner / territory for downstream pipeline
 * validation, or `null` when the prospect either doesn't exist or RLS hides
 * it (treated as 404 either way — no cross-tenant leak).
 */
export async function assertProspectAccess(
  supabase: SupabaseClient,
  prospectId: string,
): Promise<{
  workspaceId: string
  accountId: string
  current: { stage: string; ownerId: string | null; territory: string }
} | null> {
  const workspaceId = await resolveWorkspaceId(supabase)
  if (!workspaceId) return null

  const { data, error } = await supabase
    .from('prospects')
    .select('id, stage, owner_id, territory, workspace_id, account_id')
    .eq('id', prospectId)
    .eq('workspace_id', workspaceId)
    .limit(1)
    .maybeSingle()
  if (error || !data) return null
  return {
    workspaceId,
    accountId: data.account_id as string,
    current: {
      stage: data.stage as string,
      ownerId: (data.owner_id as string | null) ?? null,
      territory: data.territory as string,
    },
  }
}

export async function loadDossierStatusForProspect(
  supabase: SupabaseClient,
  prospectId: string,
): Promise<DossierStatus | null> {
  const { data, error } = await supabase
    .from('dossiers')
    .select('status')
    .eq('prospect_id', prospectId)
    .limit(1)
    .maybeSingle()
  if (error) return null
  return (data?.status as DossierStatus | null) ?? null
}

/** Kanban / ops shortcut: mark dossier ready without full validation (founder/ops only). */
export async function promoteDossierToReadyIfNeeded(
  supabase: SupabaseClient,
  prospectId: string,
  reviewerId: string,
): Promise<DossierStatus | null> {
  const { data, error } = await supabase
    .from('dossiers')
    .select('id, status')
    .eq('prospect_id', prospectId)
    .limit(1)
    .maybeSingle()
  if (error || !data) return null
  const current = data.status as DossierStatus
  if (current === 'ready') return 'ready'

  const { error: updateError } = await supabase
    .from('dossiers')
    .update({
      status: 'ready',
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', data.id)
  if (updateError) return current
  return 'ready'
}
