import 'server-only'

import { and, asc, eq } from 'drizzle-orm'
import type { Database } from '@/lib/db/client'
import { contacts, prospects } from '@/lib/db/schema'
import type { ContactDTO } from './schema'

function toIso(value: Date | string | null): string | null {
  if (!value) return null
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

export function rowToDto(row: typeof contacts.$inferSelect): ContactDTO {
  return {
    id: row.id,
    accountId: row.accountId,
    fullName: row.fullName,
    role: row.role,
    email: row.email,
    phone: row.phone,
    linkedinUrl: row.linkedinUrl,
    languages: row.languages,
    optedOutAt: toIso(row.optOutAt),
    sourceProvider: row.sourceProvider,
    createdAt: toIso(row.createdAt) ?? '',
    updatedAt: toIso(row.updatedAt) ?? '',
  }
}

/** Map a PostgREST snake_case contacts row to ContactDTO. */
export function postgrestContactToDto(row: {
  id: string
  account_id: string
  full_name: string
  role: string | null
  email: string | null
  phone: string | null
  linkedin_url: string | null
  languages: string[] | null
  opt_out_at: string | null
  source_provider: string | null
  created_at: string
  updated_at: string
}): ContactDTO {
  return {
    id: row.id,
    accountId: row.account_id,
    fullName: row.full_name,
    role: row.role,
    email: row.email,
    phone: row.phone,
    linkedinUrl: row.linkedin_url,
    languages: row.languages,
    optedOutAt: row.opt_out_at,
    sourceProvider: row.source_provider,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listContactsForProspect(
  tx: Database,
  prospectId: string,
): Promise<ContactDTO[]> {
  const rows = await tx
    .select({ contact: contacts })
    .from(contacts)
    .innerJoin(prospects, eq(prospects.accountId, contacts.accountId))
    .where(eq(prospects.id, prospectId))
    .orderBy(asc(contacts.fullName))

  return rows.map((r) => rowToDto(r.contact))
}

export async function loadProspectAccount(
  tx: Database,
  prospectId: string,
): Promise<{ accountId: string; workspaceId: string } | null> {
  const rows = await tx
    .select({ accountId: prospects.accountId, workspaceId: prospects.workspaceId })
    .from(prospects)
    .where(eq(prospects.id, prospectId))
    .limit(1)
  const row = rows[0]
  if (!row) return null
  return { accountId: row.accountId, workspaceId: row.workspaceId }
}

export async function getContactWithGuard(
  tx: Database,
  prospectId: string,
  contactId: string,
): Promise<ContactDTO | null> {
  const rows = await tx
    .select({ contact: contacts })
    .from(contacts)
    .innerJoin(prospects, eq(prospects.accountId, contacts.accountId))
    .where(and(eq(prospects.id, prospectId), eq(contacts.id, contactId)))
    .limit(1)

  return rows[0] ? rowToDto(rows[0].contact) : null
}
