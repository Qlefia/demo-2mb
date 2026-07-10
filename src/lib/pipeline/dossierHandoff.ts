import 'server-only'

import { and, eq, like } from 'drizzle-orm'
import type { Database } from '@/lib/db/client'
import { accounts, activities, dossiers, prospects, tasks } from '@/lib/db/schema'
import type { ProspectStage, Territory } from '@/lib/db/schema/enums'
import { stageRank } from '@/lib/pipeline/transitions'
import { pickSalesAssignee } from '@/lib/pipeline/salesRouting'
import { deriveDisplayName, listAllUsers } from '@/lib/team/seatService'

const FIRST_TOUCH_DUE_MS = 24 * 60 * 60 * 1000
const FIRST_TOUCH_TITLE_PREFIX = '1st touch —'

export interface DossierHandoffResult {
  stageUpdated: boolean
  ownerAssigned: boolean
  assigneeId: string | null
  assigneeName: string | null
  taskCreated: boolean
  accountName: string
  territory: Territory
}

/** True when handoff mutated stage, owner, or created the 1st-touch task (skip no-op Slack). */
export function handoffHasSideEffects(result: DossierHandoffResult): boolean {
  return result.stageUpdated || result.ownerAssigned || result.taskCreated
}

interface ProspectHandoffRow {
  id: string
  stage: ProspectStage
  territory: Territory
  ownerId: string | null
  suggestedPlaybookId: string | null
  accountName: string
  dossierSuggestedPlaybookId: string | null
}

async function loadHandoffRow(tx: Database, prospectId: string): Promise<ProspectHandoffRow | null> {
  const rows = await tx
    .select({
      id: prospects.id,
      stage: prospects.stage,
      territory: prospects.territory,
      ownerId: prospects.ownerId,
      suggestedPlaybookId: prospects.suggestedPlaybookId,
      accountName: accounts.name,
      dossierStatus: dossiers.status,
      dossierSuggestedPlaybookId: dossiers.suggestedPlaybookId,
    })
    .from(prospects)
    .innerJoin(accounts, eq(prospects.accountId, accounts.id))
    .innerJoin(dossiers, eq(dossiers.prospectId, prospects.id))
    .where(eq(prospects.id, prospectId))
    .limit(1)

  const row = rows[0]
  if (!row || row.dossierStatus !== 'ready') return null

  return {
    id: row.id,
    stage: row.stage,
    territory: row.territory,
    ownerId: row.ownerId,
    suggestedPlaybookId: row.suggestedPlaybookId,
    accountName: row.accountName,
    dossierSuggestedPlaybookId: row.dossierSuggestedPlaybookId,
  }
}

async function resolveAssigneeName(assigneeId: string | null): Promise<string | null> {
  if (!assigneeId) return null
  const users = await listAllUsers()
  const user = users.find((u) => u.id === assigneeId)
  return user ? deriveDisplayName(user) : null
}

async function hasOpenFirstTouchTask(tx: Database, prospectId: string): Promise<boolean> {
  const rows = await tx
    .select({ id: tasks.id })
    .from(tasks)
    .where(
      and(
        eq(tasks.prospectId, prospectId),
        eq(tasks.status, 'open'),
        like(tasks.title, `${FIRST_TOUCH_TITLE_PREFIX}%`),
      ),
    )
    .limit(1)
  return rows.length > 0
}

/**
 * Ops handoff side-effects when a dossier is signed off: stage → dossier_ready,
 * territory sales assign, and the standard 1st-touch task (+24h).
 * Idempotent — safe to call when stage is already dossier_ready.
 */
export async function runDossierHandoffInTx(
  tx: Database,
  prospectId: string,
  actorId: string,
): Promise<DossierHandoffResult | null> {
  const row = await loadHandoffRow(tx, prospectId)
  if (!row) return null

  let stageUpdated = false
  let ownerAssigned = false
  let assigneeId = row.ownerId

  if (stageRank(row.stage) < stageRank('dossier_ready')) {
    await tx
      .update(prospects)
      .set({ stage: 'dossier_ready', updatedAt: new Date() })
      .where(eq(prospects.id, prospectId))
    stageUpdated = true
  }

  const salesAssignee = await pickSalesAssignee(tx, row.territory)
  if (salesAssignee && salesAssignee !== row.ownerId) {
    await tx
      .update(prospects)
      .set({ ownerId: salesAssignee, updatedAt: new Date() })
      .where(eq(prospects.id, prospectId))
    assigneeId = salesAssignee
    ownerAssigned = true
  } else if (salesAssignee) {
    assigneeId = salesAssignee
  }

  let taskCreated = false
  const taskAssignee = assigneeId ?? salesAssignee
  if (taskAssignee) {
    const alreadyHasTask = await hasOpenFirstTouchTask(tx, prospectId)
    if (!alreadyHasTask) {
      const playbookId = row.suggestedPlaybookId ?? row.dossierSuggestedPlaybookId
      const dueAt = new Date(Date.now() + FIRST_TOUCH_DUE_MS)
      await tx.insert(tasks).values({
        prospectId,
        assigneeId: taskAssignee,
        title: `${FIRST_TOUCH_TITLE_PREFIX} ${row.accountName}`,
        dueAt,
        playbookId,
      })
      taskCreated = true

      await tx.insert(activities).values({
        prospectId,
        actorId,
        type: 'note',
        payload: {
          system: true,
          kind: 'handoff_task_created',
          assigneeId: taskAssignee,
          dueAt: dueAt.toISOString(),
        },
      })
    }
  }

  const assigneeName = await resolveAssigneeName(assigneeId)

  return {
    stageUpdated,
    ownerAssigned,
    assigneeId,
    assigneeName,
    taskCreated,
    accountName: row.accountName,
    territory: row.territory,
  }
}
