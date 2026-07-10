import 'server-only'

import { and, eq, sql } from 'drizzle-orm'
import type { SupabaseClient } from '@supabase/supabase-js'
import { accounts } from '@/lib/db/schema'
import type { Database } from '@/lib/db/client'

/** Normalize for duplicate checks and intake (matches DB comparisons in triggers). */
export function normalizeWebsite(input: string | undefined): string | undefined {
  if (!input) return undefined
  return input.trim().toLowerCase()
}

export interface AccountMatchSummary {
  id: string
  name: string
  website: string | null
}

/**
 * Find an existing account by normalized website first, then by exact lower(name),
 * scoped to a single workspace.
 */
export async function findMatchingAccount(
  tx: Database,
  workspaceId: string,
  accountName: string,
  website?: string | undefined,
): Promise<AccountMatchSummary | null> {
  const websiteNormalized = normalizeWebsite(website)
  if (websiteNormalized) {
    const existing = await tx
      .select({
        id: accounts.id,
        name: accounts.name,
        website: accounts.website,
      })
      .from(accounts)
      .where(
        and(
          eq(accounts.workspaceId, workspaceId),
          sql`lower(${accounts.website}) = ${websiteNormalized}`,
        ),
      )
      .limit(1)
    if (existing.length > 0) return existing[0]
  }

  if (accountName.trim().length < 2) return null

  const nameLower = accountName.trim().toLowerCase()
  const existingByName = await tx
    .select({
      id: accounts.id,
      name: accounts.name,
      website: accounts.website,
    })
    .from(accounts)
    .where(and(eq(accounts.workspaceId, workspaceId), sql`lower(${accounts.name}) = ${nameLower}`))
    .limit(1)
  return existingByName.length > 0 ? existingByName[0] : null
}

/** PostgREST duplicate check — same semantics as {@link findMatchingAccount}. */
export async function findMatchingAccountPostgrest(
  supabase: SupabaseClient,
  workspaceId: string,
  accountName: string,
  website?: string | undefined,
): Promise<AccountMatchSummary | null> {
  const websiteNormalized = normalizeWebsite(website)
  if (websiteNormalized) {
    const { data, error } = await supabase
      .from('accounts')
      .select('id, name, website')
      .eq('workspace_id', workspaceId)
      .ilike('website', websiteNormalized)
      .limit(1)
      .maybeSingle()
    if (error) throw error
    if (data) return data
  }

  if (accountName.trim().length < 2) return null

  const { data, error } = await supabase
    .from('accounts')
    .select('id, name, website')
    .eq('workspace_id', workspaceId)
    .ilike('name', accountName.trim())
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}
