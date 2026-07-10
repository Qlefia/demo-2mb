import 'server-only'

import { and, desc, eq, inArray, lt } from 'drizzle-orm'
import type { Database } from '@/lib/db/client'
import { activities, prospects } from '@/lib/db/schema'
import { isSystemActivityRow, type ActivityDTO } from './schema'
import type { ActivityType } from '@/lib/db/schema/enums'

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

export function rowToDto(row: typeof activities.$inferSelect): ActivityDTO {
  const payload = (row.payload ?? {}) as Record<string, unknown>
  return {
    id: row.id,
    prospectId: row.prospectId,
    actorId: row.actorId,
    type: row.type,
    payload,
    createdAt: toIso(row.createdAt),
    isSystem: isSystemActivityRow(row.type, payload),
  }
}

export interface ListActivitiesOptions {
  types?: ActivityType[]
  limit?: number
  before?: Date
}

/**
 * Activities on prospects owned by `ownerUserId` (newest first).
 * Intended for `/team/[userId]` activity tab; respects RLS via caller tx.
 */
export async function listActivitiesForProspectOwner(
  tx: Database,
  ownerUserId: string,
  opts: ListActivitiesOptions = {},
): Promise<ActivityDTO[]> {
  const limit = Math.min(Math.max(opts.limit ?? 100, 1), 500)
  const rows = await tx
    .select({ activity: activities })
    .from(activities)
    .innerJoin(prospects, eq(activities.prospectId, prospects.id))
    .where(eq(prospects.ownerId, ownerUserId))
    .orderBy(desc(activities.createdAt))
    .limit(limit)
  return rows.map((r) => rowToDto(r.activity))
}

export async function listActivities(
  tx: Database,
  prospectId: string,
  opts: ListActivitiesOptions = {},
): Promise<ActivityDTO[]> {
  const limit = Math.min(Math.max(opts.limit ?? 100, 1), 500)
  const conditions = [eq(activities.prospectId, prospectId)]
  if (opts.types && opts.types.length > 0) {
    conditions.push(inArray(activities.type, opts.types))
  }
  if (opts.before) {
    conditions.push(lt(activities.createdAt, opts.before))
  }
  const rows = await tx
    .select()
    .from(activities)
    .where(and(...conditions))
    .orderBy(desc(activities.createdAt))
    .limit(limit)
  return rows.map(rowToDto)
}

export async function getActivity(
  tx: Database,
  activityId: string,
): Promise<ActivityDTO | null> {
  const rows = await tx
    .select()
    .from(activities)
    .where(eq(activities.id, activityId))
    .limit(1)
  return rows[0] ? rowToDto(rows[0]) : null
}
