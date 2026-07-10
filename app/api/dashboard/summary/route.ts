import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import {
  fetchOpsHomePreview,
  fetchOpenTasksForUser,
  fetchUpcomingMeetingsForUser,
} from '@/lib/dashboard/homeSnapshot'
import { fetchUserProspectPins } from '@/lib/dashboard/userProspectPins'
import {
  fetchWorkspacePeriodKpis,
  type WorkspacePeriod,
} from '@/lib/dashboard/workspaceKpis'
import { withUserRls } from '@/lib/db/rls'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import { pickCrmRole } from '@/lib/auth/roles'
import { loadTeamWorkloadForOwner } from '@/lib/team/workload'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const OPS_HOME = new Set(['founder', 'ops', 'admin'])

export async function GET(req: Request) {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  const role = pickCrmRole((auth.user.app_metadata ?? {}).role)
  const uid = auth.user.id

  const periodParam = new URL(req.url).searchParams.get('period')
  const period: WorkspacePeriod = periodParam === 'month' ? 'month' : 'week'

  try {
    const data = await withUserRls(auth.session.access_token, async (tx) => {
      const workload = await loadTeamWorkloadForOwner(tx, uid)
      const periodKpis = await fetchWorkspacePeriodKpis(tx, period)
      const upcomingMeetings = await fetchUpcomingMeetingsForUser(tx, uid)
      const openTasks = await fetchOpenTasksForUser(tx, uid)
      const favoriteProspects = await fetchUserProspectPins(tx, uid)

      const weekRes = await tx.execute(sql`
        select count(*)::int as c
        from activities a
        where a.actor_id = ${uid}::uuid
          and a.created_at >= (now() - interval '7 days')
      `)
      const weekRows = weekRes as unknown as { c: number }[]
      const touchesLast7Days = weekRows[0]?.c ?? 0

      const base = {
        role,
        workload,
        touchesLast7Days,
        ownedActiveStages: workload.byStage,
        periodKpis,
        upcomingMeetings,
        openTasks,
        favoriteProspects,
      }

      if (role && OPS_HOME.has(role)) {
        const opsPreview = await fetchOpsHomePreview(tx)
        return { ...base, opsPreview }
      }

      return base
    })

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'private, no-store, max-age=0' },
    })
  } catch (err) {
    console.error('[api/dashboard/summary]', err)
    return NextResponse.json({ error: 'query_failed' }, { status: 500 })
  }
}
