import 'server-only'

import { count, eq } from 'drizzle-orm'
import type { Database } from '@/lib/db/client'
import { prospects } from '@/lib/db/schema'

/** Active pipeline stages we count toward “open workload” (excludes terminal states). */
const WORKLOAD_STAGES = [
  'new',
  'triaged',
  'enriching',
  'dossier_in_progress',
  'dossier_ready',
  '1st_call',
  'meeting_scheduled',
  'proposal_sent',
] as const

export interface TeamWorkloadSnapshot {
  /** Prospects owned by user in “active” stages */
  activeOwnedCount: number
  /** Total prospects with owner_id (any stage) — informational */
  totalOwnedCount: number
  /** Breakdown by stage */
  byStage: Record<string, number>
}

/**
 * Prospect counts for pipeline KPIs / team page (runs inside `withUserRls`).
 */
export async function loadTeamWorkloadForOwner(
  tx: Database,
  ownerId: string,
): Promise<TeamWorkloadSnapshot> {
  const rows = await tx
    .select({
      stage: prospects.stage,
      c: count(),
    })
    .from(prospects)
    .where(eq(prospects.ownerId, ownerId))
    .groupBy(prospects.stage)

  const byStage: Record<string, number> = {}
  let totalOwned = 0
  let activeOwned = 0

  for (const r of rows) {
    const n = Number(r.c)
    byStage[r.stage] = n
    totalOwned += n
    if ((WORKLOAD_STAGES as readonly string[]).includes(r.stage)) {
      activeOwned += n
    }
  }

  return {
    activeOwnedCount: activeOwned,
    totalOwnedCount: totalOwned,
    byStage,
  }
}

/**
 * Single number for future auto-assign: active owned prospects in pipeline.
 */
export async function getActiveLoad(tx: Database, ownerId: string): Promise<number> {
  const snap = await loadTeamWorkloadForOwner(tx, ownerId)
  return snap.activeOwnedCount
}
