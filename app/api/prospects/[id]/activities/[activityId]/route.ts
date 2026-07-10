import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { withUserRls } from '@/lib/db/rls'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import { activities } from '@/lib/db/schema'
import {
  isSystemActivityRow,
  updateActivitySchema,
} from '@/lib/activities/schema'
import { getActivity, rowToDto } from '@/lib/activities/service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const idSchema = z.string().uuid()

interface RouteContext {
  params: Promise<{ id: string; activityId: string }>
}

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  const { id, activityId } = await ctx.params
  const parsedId = idSchema.safeParse(id)
  const parsedActivity = idSchema.safeParse(activityId)
  if (!parsedId.success || !parsedActivity.success) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const parsed = updateActivitySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  try {
    const outcome = await withUserRls(auth.session.access_token, async (tx) => {
      const existing = await getActivity(tx, parsedActivity.data)
      if (!existing) {
        return { ok: false as const, status: 404, body: { error: 'not_found' } }
      }
      if (existing.prospectId !== parsedId.data) {
        return { ok: false as const, status: 404, body: { error: 'not_found' } }
      }
      if (isSystemActivityRow(existing.type, existing.payload)) {
        return { ok: false as const, status: 403, body: { error: 'system_immutable' } }
      }
      if (parsed.data.type !== existing.type) {
        return { ok: false as const, status: 422, body: { error: 'type_mismatch' } }
      }
      const updated = await tx
        .update(activities)
        .set({ payload: parsed.data.payload as Record<string, unknown> })
        .where(eq(activities.id, parsedActivity.data))
        .returning()
      if (updated.length === 0) {
        return { ok: false as const, status: 403, body: { error: 'forbidden' } }
      }
      return { ok: true as const, activity: rowToDto(updated[0]) }
    })

    if (!outcome.ok) {
      return NextResponse.json(outcome.body, { status: outcome.status })
    }
    return NextResponse.json({ activity: outcome.activity })
  } catch (err) {
    console.error('[api/prospects/:id/activities/:activityId PATCH] failed', err)
    return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const { id, activityId } = await ctx.params
  const parsedId = idSchema.safeParse(id)
  const parsedActivity = idSchema.safeParse(activityId)
  if (!parsedId.success || !parsedActivity.success) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  try {
    const outcome = await withUserRls(auth.session.access_token, async (tx) => {
      const existing = await getActivity(tx, parsedActivity.data)
      if (!existing) {
        return { ok: false as const, status: 404, body: { error: 'not_found' } }
      }
      if (existing.prospectId !== parsedId.data) {
        return { ok: false as const, status: 404, body: { error: 'not_found' } }
      }
      if (isSystemActivityRow(existing.type, existing.payload)) {
        return { ok: false as const, status: 403, body: { error: 'system_immutable' } }
      }
      const deleted = await tx
        .delete(activities)
        .where(eq(activities.id, parsedActivity.data))
        .returning({ id: activities.id })
      if (deleted.length === 0) {
        return { ok: false as const, status: 403, body: { error: 'forbidden' } }
      }
      return { ok: true as const }
    })

    if (!outcome.ok) {
      return NextResponse.json(outcome.body, { status: outcome.status })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/prospects/:id/activities/:activityId DELETE] failed', err)
    return NextResponse.json({ error: 'delete_failed' }, { status: 500 })
  }
}
