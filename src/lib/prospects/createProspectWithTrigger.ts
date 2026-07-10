import 'server-only'

import { and, eq, sql } from 'drizzle-orm'
import type { SupabaseClient } from '@supabase/supabase-js'
import { accounts, prospects, triggers } from '@/lib/db/schema'
import type { Database } from '@/lib/db/client'
import type { ProspectSource, Territory } from '@/lib/db/schema/enums'
import { findMatchingAccountPostgrest, normalizeWebsite } from '@/lib/prospects/accountDedupe'

export interface ProspectTriggerInsertInput {
  workspaceId: string
  accountName: string
  website?: string | undefined
  territory: Territory
  source: ProspectSource
  priority?: number | undefined
  triggerText: string
  triggerType: string
  triggerSourceUrl?: string | undefined
  /** Set on manual/API creates; webhooks may omit (null `created_by`). */
  createdByUserId?: string | undefined
}

/**
 * Upsert-ish account resolve by website or name, insert prospect (`new`), insert trigger row.
 * Caller wraps in `withUserRls` or privileged `db.transaction`.
 */
export async function insertProspectWithTrigger(
  tx: Database,
  input: ProspectTriggerInsertInput,
): Promise<{ prospectId: string; accountId: string }> {
  const body = input
  const websiteNormalized = normalizeWebsite(body.website)

  let accountId: string

  if (websiteNormalized) {
    const existing = await tx
      .select({ id: accounts.id })
      .from(accounts)
      .where(
        and(
          eq(accounts.workspaceId, body.workspaceId),
          sql`lower(${accounts.website}) = ${websiteNormalized}`,
        ),
      )
      .limit(1)
    if (existing.length > 0) {
      accountId = existing[0].id
      await tx
        .update(accounts)
        .set({ name: body.accountName, updatedAt: sql`now()` })
        .where(eq(accounts.id, accountId))
    } else {
      const rows = await tx
        .insert(accounts)
        .values({
          name: body.accountName,
          website: body.website,
          workspaceId: body.workspaceId,
        })
        .returning({ id: accounts.id })
      accountId = rows[0].id
    }
  } else {
    const existingByName = await tx
      .select({ id: accounts.id })
      .from(accounts)
      .where(
        and(
          eq(accounts.workspaceId, body.workspaceId),
          sql`lower(${accounts.name}) = ${body.accountName.toLowerCase()}`,
        ),
      )
      .limit(1)
    if (existingByName.length > 0) {
      accountId = existingByName[0].id
    } else {
      const rows = await tx
        .insert(accounts)
        .values({ name: body.accountName, workspaceId: body.workspaceId })
        .returning({ id: accounts.id })
      accountId = rows[0].id
    }
  }

  const priority = body.priority ?? 3

  const insertValues: typeof prospects.$inferInsert = {
    accountId,
    workspaceId: body.workspaceId,
    source: body.source,
    territory: body.territory,
    stage: 'new',
    priority,
  }
  if (body.createdByUserId) {
    insertValues.createdBy = body.createdByUserId
  }

  const inserted = await tx.insert(prospects).values(insertValues).returning({ id: prospects.id })

  const prospectId = inserted[0].id

  await tx.insert(triggers).values({
    accountId,
    workspaceId: body.workspaceId,
    prospectId,
    type: body.triggerType,
    sourceUrl: body.triggerSourceUrl ?? null,
    occurredAt: sql`now()` as unknown as Date,
    payload: { text: body.triggerText },
  })

  return { prospectId, accountId }
}

/**
 * Same as {@link insertProspectWithTrigger} but via PostgREST + user JWT (RLS enforced).
 * Used by authenticated API routes — not webhooks.
 */
export async function insertProspectWithTriggerPostgrest(
  supabase: SupabaseClient,
  input: ProspectTriggerInsertInput,
): Promise<{ prospectId: string; accountId: string }> {
  const websiteNormalized = normalizeWebsite(input.website)
  let accountId: string

  if (websiteNormalized) {
    const { data: existing, error: findErr } = await supabase
      .from('accounts')
      .select('id')
      .eq('workspace_id', input.workspaceId)
      .ilike('website', websiteNormalized)
      .limit(1)
      .maybeSingle()
    if (findErr) throw findErr

    if (existing) {
      accountId = existing.id
      const { error: updateErr } = await supabase
        .from('accounts')
        .update({ name: input.accountName })
        .eq('id', accountId)
      if (updateErr) throw updateErr
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from('accounts')
        .insert({
          name: input.accountName,
          website: input.website,
          workspace_id: input.workspaceId,
        })
        .select('id')
        .single()
      if (insertErr) throw insertErr
      accountId = inserted.id
    }
  } else {
    const existing = await findMatchingAccountPostgrest(
      supabase,
      input.workspaceId,
      input.accountName,
    )
    if (existing) {
      accountId = existing.id
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from('accounts')
        .insert({
          name: input.accountName,
          workspace_id: input.workspaceId,
        })
        .select('id')
        .single()
      if (insertErr) throw insertErr
      accountId = inserted.id
    }
  }

  const prospectRow: Record<string, unknown> = {
    account_id: accountId,
    workspace_id: input.workspaceId,
    source: input.source,
    territory: input.territory,
    stage: 'new',
    priority: input.priority ?? 3,
  }
  if (input.createdByUserId) {
    prospectRow.created_by = input.createdByUserId
  }

  const { data: prospect, error: prospectErr } = await supabase
    .from('prospects')
    .insert(prospectRow)
    .select('id')
    .single()
  if (prospectErr) throw prospectErr

  const { error: triggerErr } = await supabase.from('triggers').insert({
    account_id: accountId,
    workspace_id: input.workspaceId,
    prospect_id: prospect.id,
    type: input.triggerType,
    source_url: input.triggerSourceUrl ?? null,
    occurred_at: new Date().toISOString(),
    payload: { text: input.triggerText },
  })
  if (triggerErr) throw triggerErr

  return { prospectId: prospect.id, accountId }
}
