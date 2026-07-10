import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { z } from 'zod'
import { listActivitiesForProspectOwner } from '@/lib/activities/service'
import { withUserRls } from '@/lib/db/rls'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import { rowToProspect, withProspectUserLabels, type RawProspectRow } from '@/lib/prospects/serialize'
import { deriveDisplayName, listAllUsers } from '@/lib/team/seatService'
import { canViewTeamMemberProfile } from '@/lib/team/access'
import type { PipelineRole } from '@/lib/team/access'
import { fetchWeeklyTouchBuckets } from '@/lib/team/kpiSeries'
import { loadTeamWorkloadForOwner } from '@/lib/team/workload'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const idSchema = z.string().uuid()

interface RouteContext {
  params: Promise<{ userId: string }>
}

export async function GET(_req: Request, ctx: RouteContext) {
  const { userId } = await ctx.params
  const parsed = idSchema.safeParse(userId)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }

  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  const role = (auth.user.app_metadata as { role?: string } | undefined)?.role as PipelineRole
  if (!canViewTeamMemberProfile(role, auth.user.id, parsed.data)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  try {
    const payload = await withUserRls(auth.session.access_token, async (tx) => {
      const workload = await loadTeamWorkloadForOwner(tx, parsed.data)
      const kpiSeries = await fetchWeeklyTouchBuckets(tx, parsed.data, 12)
      const activityItems = await listActivitiesForProspectOwner(tx, parsed.data, { limit: 50 })

      const result = await tx.execute(sql`
        select
          p.id,
          p.account_id,
          p.owner_id,
          p.created_by,
          p.source,
          p.territory,
          p.stage,
          p.priority,
          p.triage_decision,
          p.lost_reason,
          p.suggested_playbook_id,
          p.created_at,
          p.updated_at,
          a.name as account_name,
          a.website as account_website,
          t.text as trigger_text,
          t.captured_at as trigger_captured_at,
          d.status as dossier_status
        from prospects p
        join accounts a on a.id = p.account_id
        left join dossiers d on d.prospect_id = p.id
        left join lateral (
          select
            coalesce(
              tr.payload ->> 'text',
              tr.payload ->> 'summary',
              tr.type
            ) as text,
            tr.occurred_at as captured_at
          from triggers tr
          where tr.account_id = p.account_id
          order by tr.occurred_at desc
          limit 1
        ) t on true
        where p.owner_id = ${parsed.data}::uuid
        order by p.updated_at desc
      `)
      const rows = (result as unknown as RawProspectRow[]) ?? []
      const prospects = rows.map(rowToProspect)
      const labeled = await withProspectUserLabels(prospects)

      return {
        userId: parsed.data,
        workload,
        kpiSeries,
        prospects: labeled,
        activities: activityItems,
      }
    })

    const users = await listAllUsers()
    const target = users.find((u) => u.id === parsed.data)
    const targetDisplayName = target ? deriveDisplayName(target) : null

    return NextResponse.json(
      { ...payload, targetDisplayName },
      {
        headers: { 'Cache-Control': 'private, no-store, max-age=0' },
      },
    )
  } catch (err) {
    console.error('[api/team/:userId] GET failed', err)
    return NextResponse.json({ error: 'query_failed' }, { status: 500 })
  }
}
