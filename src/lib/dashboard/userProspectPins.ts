import 'server-only'

import { asc, eq, inArray } from 'drizzle-orm'
import type { Database } from '@/lib/db/client'
import { accounts, contacts, prospects, userProspectPins } from '@/lib/db/schema'

export interface DashboardFavoriteProspect {
  prospectId: string
  accountName: string
  stage: string
  territory: string
  sortOrder: number
  primaryPhone: string | null
  primaryEmail: string | null
}

export async function fetchUserProspectPins(
  tx: Database,
  userId: string,
): Promise<DashboardFavoriteProspect[]> {
  const rows = await tx
    .select({
      prospectId: userProspectPins.prospectId,
      sortOrder: userProspectPins.sortOrder,
      accountName: accounts.name,
      stage: prospects.stage,
      territory: prospects.territory,
      primaryPhone: contacts.phone,
      primaryEmail: contacts.email,
    })
    .from(userProspectPins)
    .innerJoin(prospects, eq(prospects.id, userProspectPins.prospectId))
    .innerJoin(accounts, eq(accounts.id, prospects.accountId))
    .leftJoin(contacts, eq(contacts.id, prospects.primaryContactId))
    .where(eq(userProspectPins.userId, userId))
    .orderBy(asc(userProspectPins.sortOrder), asc(userProspectPins.createdAt))

  return rows.map((row) => ({
    prospectId: row.prospectId,
    accountName: row.accountName,
    stage: row.stage,
    territory: row.territory,
    sortOrder: row.sortOrder,
    primaryPhone: row.primaryPhone?.trim() || null,
    primaryEmail: row.primaryEmail?.trim() || null,
  }))
}

export async function replaceUserProspectPins(
  tx: Database,
  userId: string,
  prospectIds: string[],
): Promise<void> {
  await tx.delete(userProspectPins).where(eq(userProspectPins.userId, userId))

  if (prospectIds.length === 0) return

  const visible = await tx
    .select({ id: prospects.id })
    .from(prospects)
    .where(inArray(prospects.id, prospectIds))

  const visibleSet = new Set(visible.map((r) => r.id))
  const ordered = prospectIds.filter((id) => visibleSet.has(id))

  if (ordered.length === 0) return

  await tx.insert(userProspectPins).values(
    ordered.map((prospectId, index) => ({
      userId,
      prospectId,
      sortOrder: index,
    })),
  )
}

export async function toggleUserProspectPin(
  tx: Database,
  userId: string,
  prospectId: string,
  maxPins: number,
): Promise<{ pinned: boolean; items: DashboardFavoriteProspect[] }> {
  const existing = await tx
    .select({ prospectId: userProspectPins.prospectId })
    .from(userProspectPins)
    .where(eq(userProspectPins.userId, userId))

  const ids = existing.map((r) => r.prospectId)
  const isPinned = ids.includes(prospectId)

  if (isPinned) {
    const next = ids.filter((id) => id !== prospectId)
    await replaceUserProspectPins(tx, userId, next)
  } else {
    if (ids.length >= maxPins) {
      throw new Error('pin_limit_reached')
    }
    const visible = await tx
      .select({ id: prospects.id })
      .from(prospects)
      .where(eq(prospects.id, prospectId))
      .limit(1)
    if (visible.length === 0) {
      throw new Error('prospect_not_found')
    }
    await replaceUserProspectPins(tx, userId, [...ids, prospectId])
  }

  const items = await fetchUserProspectPins(tx, userId)
  return { pinned: !isPinned, items }
}

/** Re-sync pins after prospect visibility changes (drops stale rows). */
export async function pruneInvisiblePins(tx: Database, userId: string): Promise<void> {
  const items = await fetchUserProspectPins(tx, userId)
  await replaceUserProspectPins(tx, userId, items.map((i) => i.prospectId))
}
