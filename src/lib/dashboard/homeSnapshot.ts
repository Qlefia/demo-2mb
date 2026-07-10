import 'server-only'

import { and, asc, eq, inArray, sql } from 'drizzle-orm'
import type { Database } from '@/lib/db/client'
import { accounts, prospects, tasks } from '@/lib/db/schema'
import { listCalendarMeetings } from '@/lib/meetings/service'
import type { CalendarMeetingDTO } from '@/lib/meetings/schema'
import {
  fetchDossierReviewQueue,
  fetchOpsKpis,
  fetchTriageQueue,
  type OpsProspectSummary,
  type OpsTodayKpis,
} from '@/lib/ops/today'

export interface DashboardOpenTask {
  id: string
  title: string
  status: string
  dueAt: string | null
  prospectId: string | null
  accountName: string | null
}

const UPCOMING_MEETING_LIMIT = 4
const OPEN_TASK_LIMIT = 5
const OPS_PREVIEW_LIMIT = 3

export async function fetchUpcomingMeetingsForUser(
  tx: Database,
  userId: string,
): Promise<CalendarMeetingDTO[]> {
  const from = new Date()
  const to = new Date(from)
  to.setDate(to.getDate() + 7)

  const items = await listCalendarMeetings(tx, {
    from,
    to,
    scope: 'mine',
    currentUserId: userId,
    statuses: ['scheduled'],
  })

  return items.slice(0, UPCOMING_MEETING_LIMIT)
}

export async function fetchOpenTasksForUser(
  tx: Database,
  userId: string,
): Promise<DashboardOpenTask[]> {
  const rows = await tx
    .select({
      id: tasks.id,
      title: tasks.title,
      status: tasks.status,
      dueAt: tasks.dueAt,
      prospectId: tasks.prospectId,
      accountName: accounts.name,
    })
    .from(tasks)
    .leftJoin(prospects, eq(prospects.id, tasks.prospectId))
    .leftJoin(accounts, eq(accounts.id, prospects.accountId))
    .where(
      and(
        eq(tasks.assigneeId, userId),
        inArray(tasks.status, ['open', 'in_progress']),
      ),
    )
    .orderBy(sql`${tasks.dueAt} asc nulls last`, asc(tasks.createdAt))
    .limit(OPEN_TASK_LIMIT)

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    dueAt: row.dueAt ? toIso(row.dueAt) : null,
    prospectId: row.prospectId,
    accountName: row.accountName,
  }))
}

function toIso(value: Date | string): string {
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? new Date(0).toISOString() : d.toISOString()
}

export interface OpsHomePreview {
  triageCount: number
  dossierReviewCount: number
  triagePreview: OpsProspectSummary[]
  dossierPreview: OpsProspectSummary[]
  kpis: OpsTodayKpis
}

export async function fetchOpsHomePreview(tx: Database): Promise<OpsHomePreview> {
  const triage = await fetchTriageQueue(tx)
  const dossierReview = await fetchDossierReviewQueue(tx)
  const kpis = await fetchOpsKpis(tx)

  const triageCountRes = await tx.execute(sql`
    select count(*)::int as c from prospects where stage = 'new'
  `)
  const reviewCountRes = await tx.execute(sql`
    select count(*)::int as c
    from prospects p
    join dossiers d on d.prospect_id = p.id
    where d.status in ('draft', 'in_review')
      and p.stage in ('enriching', 'dossier_in_progress')
  `)
  const triageCountRows = triageCountRes as unknown as { c: number }[]
  const reviewCountRows = reviewCountRes as unknown as { c: number }[]

  return {
    triageCount: triageCountRows[0]?.c ?? 0,
    dossierReviewCount: reviewCountRows[0]?.c ?? 0,
    triagePreview: triage.slice(0, OPS_PREVIEW_LIMIT),
    dossierPreview: dossierReview.slice(0, OPS_PREVIEW_LIMIT),
    kpis,
  }
}
