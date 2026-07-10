import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withUserRls } from '@/lib/db/rls'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import { pickCrmRole } from '@/lib/auth/roles'
import { CALENDAR_SCOPES, type CalendarScope } from '@/lib/meetings/schema'
import { listCalendarMeetings } from '@/lib/meetings/service'
import { MEETING_STATUSES } from '@/lib/db/schema/enums'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const querySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  scope: z.enum(CALENDAR_SCOPES).default('mine'),
  assigneeId: z.string().uuid().optional(),
  prospectId: z.string().uuid().optional(),
  status: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(',').filter(Boolean) : ['scheduled'])),
})

const PRIVILEGED_ROLES = new Set(['founder', 'ops', 'admin'])

export async function GET(request: NextRequest) {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_query', issues: parsed.error.issues }, { status: 400 })
  }

  const { from, to, scope, assigneeId, prospectId, status } = parsed.data
  const role = pickCrmRole(auth.user.app_metadata?.role)

  let effectiveScope: CalendarScope = scope
  if (scope === 'team' || scope === 'all') {
    if (!role || !PRIVILEGED_ROLES.has(role)) {
      effectiveScope = 'mine'
    }
  }

  const statuses = status.filter((s): s is (typeof MEETING_STATUSES)[number] =>
    (MEETING_STATUSES as readonly string[]).includes(s),
  )

  try {
    const items = await withUserRls(auth.session.access_token, async (tx) =>
      listCalendarMeetings(tx, {
        from: new Date(from),
        to: new Date(to),
        scope: effectiveScope,
        currentUserId: auth.user.id,
        assigneeId: effectiveScope === 'team' ? assigneeId : null,
        prospectId: prospectId ?? null,
        statuses: statuses.length ? statuses : ['scheduled'],
      }),
    )
    return NextResponse.json({ items, scope: effectiveScope })
  } catch (err) {
    console.error('[api/calendar GET] failed', err)
    return NextResponse.json({ error: 'query_failed' }, { status: 500 })
  }
}
