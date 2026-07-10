import 'server-only'

import { sql } from 'drizzle-orm'
import type { Database } from '@/lib/db/client'

/** ISO date (UTC) for Monday week boundary — informational label only */
export interface WeeklyTouchBucket {
  weekStart: string
  call: number
  email: number
  note: number
  linkedin: number
}

/**
 * Last N ISO weeks (Monday UTC) with activity counts by user-facing type for `actor_id`.
 */
export async function fetchWeeklyTouchBuckets(
  tx: Database,
  actorId: string,
  weeks: number,
): Promise<WeeklyTouchBucket[]> {
  const boundedWeeks = Math.min(Math.max(weeks, 4), 52)

  const result = await tx.execute(sql`
    with bounds as (
      select
        date_trunc('week', timezone('UTC', now()))::date as current_week,
        ${boundedWeeks}::int as n_weeks
    ),
    week_starts as (
      select (b.current_week - (gs * interval '1 week'))::date as week_start
      from bounds b
      cross join lateral generate_series(0, b.n_weeks - 1) as gs
    ),
    typed as (
      select
        date_trunc('week', timezone('UTC', a.created_at))::date as week_start,
        count(*) filter (where a.type = 'call')::int as call,
        count(*) filter (where a.type = 'email')::int as email,
        count(*) filter (where a.type = 'note')::int as note,
        count(*) filter (where a.type = 'linkedin')::int as linkedin
      from activities a
      where a.actor_id = ${actorId}::uuid
        and a.created_at >= timezone('UTC', now()) - (${boundedWeeks}::text || ' weeks')::interval
        and a.type in ('call', 'email', 'note', 'linkedin')
      group by 1
    )
    select
      ws.week_start::text as week_start,
      coalesce(t.call, 0)::int as call,
      coalesce(t.email, 0)::int as email,
      coalesce(t.note, 0)::int as note,
      coalesce(t.linkedin, 0)::int as linkedin
    from week_starts ws
    left join typed t on t.week_start = ws.week_start
    order by ws.week_start asc
  `)

  const rows = result as unknown as {
    week_start: string
    call: number
    email: number
    note: number
    linkedin: number
  }[]

  return rows.map((r) => ({
    weekStart: r.week_start.slice(0, 10),
    call: r.call,
    email: r.email,
    note: r.note,
    linkedin: r.linkedin,
  }))
}
