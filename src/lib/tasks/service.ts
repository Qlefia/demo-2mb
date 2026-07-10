import 'server-only'

import { and, asc, desc, eq, inArray } from 'drizzle-orm'
import type { Database } from '@/lib/db/client'
import { tasks } from '@/lib/db/schema'
import type { TaskStatus } from '@/lib/db/schema/enums'
import type { TaskDTO } from './schema'

function toIso(value: Date | string | null): string | null {
  if (value === null) return null
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

export function rowToDto(row: typeof tasks.$inferSelect): TaskDTO {
  return {
    id: row.id,
    prospectId: row.prospectId,
    assigneeId: row.assigneeId,
    title: row.title,
    status: row.status,
    dueAt: toIso(row.dueAt),
    playbookId: row.playbookId,
    createdAt: toIso(row.createdAt) as string,
    completedAt: toIso(row.completedAt),
  }
}

export interface ListTasksOptions {
  statuses?: TaskStatus[]
  limit?: number
}

export async function listTasksForProspect(
  tx: Database,
  prospectId: string,
  opts: ListTasksOptions = {},
): Promise<TaskDTO[]> {
  const limit = Math.min(Math.max(opts.limit ?? 100, 1), 500)
  const conditions = [eq(tasks.prospectId, prospectId)]
  if (opts.statuses && opts.statuses.length > 0) {
    conditions.push(inArray(tasks.status, opts.statuses))
  }
  // Ordering: open/in_progress by due date asc (overdue first), done last by completedAt desc
  const rows = await tx
    .select()
    .from(tasks)
    .where(and(...conditions))
    .orderBy(asc(tasks.status), asc(tasks.dueAt), desc(tasks.createdAt))
    .limit(limit)
  return rows.map(rowToDto)
}

export async function getTask(tx: Database, taskId: string): Promise<TaskDTO | null> {
  const rows = await tx.select().from(tasks).where(eq(tasks.id, taskId)).limit(1)
  return rows[0] ? rowToDto(rows[0]) : null
}
