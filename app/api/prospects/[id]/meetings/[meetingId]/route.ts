import { NextRequest, NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { withUserRls } from '@/lib/db/rls'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import { meetings } from '@/lib/db/schema'
import { rowToMeetingDto, updateMeetingSchema } from '@/lib/meetings/schema'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const idSchema = z.string().uuid()

interface RouteContext {
  params: Promise<{ id: string; meetingId: string }>
}

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  const { id, meetingId } = await ctx.params
  const parsedProspectId = idSchema.safeParse(id)
  const parsedMeetingId = idSchema.safeParse(meetingId)
  if (!parsedProspectId.success || !parsedMeetingId.success) {
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
  const parsed = updateMeetingSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', issues: parsed.error.issues },
      { status: 400 },
    )
  }
  const body = parsed.data

  try {
    const outcome = await withUserRls(auth.session.access_token, async (tx) => {
      const patch: Partial<typeof meetings.$inferInsert> = {}
      if (body.title !== undefined) patch.title = body.title.trim()
      if (body.startsAt !== undefined) patch.startsAt = new Date(body.startsAt)
      if (body.endsAt !== undefined) patch.endsAt = body.endsAt ? new Date(body.endsAt) : null
      if (body.location !== undefined) patch.location = body.location?.trim() || null
      if (body.contactId !== undefined) patch.contactId = body.contactId
      if (body.notes !== undefined) patch.notes = body.notes?.trim() || null
      if (body.status !== undefined) patch.status = body.status
      if (body.assigneeId !== undefined) patch.assigneeId = body.assigneeId

      const [row] = await tx
        .update(meetings)
        .set(patch)
        .where(
          and(eq(meetings.id, parsedMeetingId.data), eq(meetings.prospectId, parsedProspectId.data)),
        )
        .returning()
      return row ?? null
    })
    if (!outcome) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    return NextResponse.json({ meeting: rowToMeetingDto(outcome) })
  } catch (err) {
    console.error('[api/prospects/:id/meetings/:meetingId PATCH] failed', err)
    return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const { id, meetingId } = await ctx.params
  const parsedProspectId = idSchema.safeParse(id)
  const parsedMeetingId = idSchema.safeParse(meetingId)
  if (!parsedProspectId.success || !parsedMeetingId.success) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  try {
    const deleted = await withUserRls(auth.session.access_token, async (tx) => {
      const [row] = await tx
        .delete(meetings)
        .where(
          and(eq(meetings.id, parsedMeetingId.data), eq(meetings.prospectId, parsedProspectId.data)),
        )
        .returning({ id: meetings.id })
      return row ?? null
    })
    if (!deleted) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/prospects/:id/meetings/:meetingId DELETE] failed', err)
    return NextResponse.json({ error: 'delete_failed' }, { status: 500 })
  }
}
