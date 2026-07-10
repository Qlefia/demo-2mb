import 'server-only'

import { sql } from 'drizzle-orm'
import type { Database } from '@/lib/db/client'

export type WorkspacePeriod = 'week' | 'month'

export interface WorkspacePeriodKpis {
  period: WorkspacePeriod
  /** Prospects created in window (RLS-scoped) */
  newProspects: number
  /** Stage transitions to dossier_ready in window */
  transitionsToDossierReady: number
  /** Prospect moved to won (via stage_change activity) */
  wonCount: number
  /** Prospect moved to lost */
  lostCount: number
  /** Avg hours from prospect.created_at to dossier_delivered activity in window */
  avgHoursToReady: number | null
}

function intervalForPeriod(period: WorkspacePeriod) {
  return period === 'month' ? sql`interval '30 days'` : sql`interval '7 days'`
}

export async function fetchWorkspacePeriodKpis(
  tx: Database,
  period: WorkspacePeriod,
): Promise<WorkspacePeriodKpis> {
  const win = intervalForPeriod(period)

  const newRes = await tx.execute(sql`
    select count(*)::int as c from prospects
    where created_at >= now() - ${win}
  `)
  const newRows = newRes as unknown as { c: number }[]
  const newProspects = newRows[0]?.c ?? 0

  const readyRes = await tx.execute(sql`
    select count(*)::int as c
    from activities a
    where a.type = 'stage_change'
      and a.created_at >= now() - ${win}
      and (
        coalesce(a.payload #>> '{stage,to}', a.payload ->> 'to') = 'dossier_ready'
      )
  `)
  const readyRows = readyRes as unknown as { c: number }[]
  const transitionsToDossierReady = readyRows[0]?.c ?? 0

  const wonRes = await tx.execute(sql`
    select count(*)::int as c
    from activities a
    where a.type = 'stage_change'
      and a.created_at >= now() - ${win}
      and coalesce(a.payload #>> '{stage,to}', a.payload ->> 'to') = 'won'
  `)
  const lostRes = await tx.execute(sql`
    select count(*)::int as c
    from activities a
    where a.type = 'stage_change'
      and a.created_at >= now() - ${win}
      and coalesce(a.payload #>> '{stage,to}', a.payload ->> 'to') = 'lost'
  `)
  const wonRows = wonRes as unknown as { c: number }[]
  const lostRows = lostRes as unknown as { c: number }[]

  const avgRes = await tx.execute(sql`
    select
      avg(
        extract(epoch from (del.created_at - p.created_at)) / 3600.0
      )::float8 as avg_hours
    from activities del
    join prospects p on p.id = del.prospect_id
    where del.type = 'dossier_delivered'
      and del.created_at >= now() - ${win}
  `)
  const avgRows = avgRes as unknown as { avg_hours: number | null }[]
  const raw = avgRows[0]?.avg_hours
  const avgHoursToReady =
    raw != null && !Number.isNaN(raw) ? Math.round(raw * 10) / 10 : null

  return {
    period,
    newProspects,
    transitionsToDossierReady,
    wonCount: wonRows[0]?.c ?? 0,
    lostCount: lostRows[0]?.c ?? 0,
    avgHoursToReady,
  }
}
