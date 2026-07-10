import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { and, eq, sql as drSql } from 'drizzle-orm'
import { withUserRls } from '@/lib/db/rls'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import { activities, prospects } from '@/lib/db/schema'
import { ACTIVITY_TYPES, type ActivityType } from '@/lib/db/schema/enums'
import {
  createActivitySchema,
  isUserActivityType,
} from '@/lib/activities/schema'
import { listActivities, rowToDto } from '@/lib/activities/service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const idSchema = z.string().uuid()

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params
  const parsedId = idSchema.safeParse(id)
  if (!parsedId.success) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth
  const url = new URL(request.url)
  const typesParam = url.searchParams.get('types')
  const limitParam = url.searchParams.get('limit')
  const types = typesParam
    ? (typesParam
        .split(',')
        .map((t) => t.trim())
        .filter((t): t is ActivityType =>
          (ACTIVITY_TYPES as readonly string[]).includes(t),
        ))
    : undefined
  const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined

  try {
    const items = await withUserRls(auth.session.access_token, (tx) =>
      listActivities(tx, parsedId.data, { types, limit }),
    )
    return NextResponse.json({ items })
  } catch (err) {
    console.error('[api/prospects/:id/activities GET] failed', err)
    return NextResponse.json({ error: 'query_failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params
  const parsedId = idSchema.safeParse(id)
  if (!parsedId.success) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth
  const { user, session } = auth
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const parsed = createActivitySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', issues: parsed.error.issues },
      { status: 400 },
    )
  }
  if (!isUserActivityType(parsed.data.type)) {
    return NextResponse.json({ error: 'system_type_forbidden' }, { status: 422 })
  }

  try {
    const result = await withUserRls(session.access_token, async (tx) => {
      const exists = await tx
        .select({ id: prospects.id })
        .from(prospects)
        .where(eq(prospects.id, parsedId.data))
        .limit(1)
      if (exists.length === 0) {
        return { ok: false as const, status: 404, body: { error: 'prospect_not_found' } }
      }
      const rawPayload = parsed.data.payload as Record<string, unknown>
      const contactId =
        typeof rawPayload.contactId === 'string' ? rawPayload.contactId : undefined
      if (contactId) {
        const dup = await tx
          .select({ id: activities.id })
          .from(activities)
          .where(
            and(
              eq(activities.prospectId, parsedId.data),
              eq(activities.type, parsed.data.type),
              drSql`coalesce(${activities.payload}::jsonb->>'contactId','') = ${contactId}`,
              drSql`${activities.createdAt} > now() - interval '24 hours'`,
            ),
          )
          .limit(1)
        if (dup.length > 0) {
          return {
            ok: false as const,
            status: 409,
            body: { error: 'duplicate_activity_contact' },
          }
        }
      }
      const inserted = await tx
        .insert(activities)
        .values({
          prospectId: parsedId.data,
          actorId: user.id,
          type: parsed.data.type,
          payload: parsed.data.payload as Record<string, unknown>,
        })
        .returning()
      return { ok: true as const, activity: rowToDto(inserted[0]) }
    })

    if (!result.ok) {
      return NextResponse.json(result.body, { status: result.status })
    }
    return NextResponse.json({ activity: result.activity }, { status: 201 })
  } catch (err) {
    console.error('[api/prospects/:id/activities POST] failed', err)
    return NextResponse.json({ error: 'create_failed' }, { status: 500 })
  }
}
