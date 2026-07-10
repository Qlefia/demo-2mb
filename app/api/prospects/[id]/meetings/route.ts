import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withUserRls } from '@/lib/db/rls'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import { meetings } from '@/lib/db/schema'
import { createMeetingSchema, rowToMeetingDto } from '@/lib/meetings/schema'
import { assertProspectExists, listMeetingsForProspect } from '@/lib/meetings/service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const idSchema = z.string().uuid()

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params
  const parsedId = idSchema.safeParse(id)
  if (!parsedId.success) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  try {
    const items = await withUserRls(auth.session.access_token, async (tx) => {
      const exists = await assertProspectExists(tx, parsedId.data)
      if (!exists) return null
      return listMeetingsForProspect(tx, parsedId.data)
    })
    if (items === null) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    return NextResponse.json({ items })
  } catch (err) {
    console.error('[api/prospects/:id/meetings GET] failed', err)
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

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const parsed = createMeetingSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', issues: parsed.error.issues },
      { status: 400 },
    )
  }
  const body = parsed.data

  try {
    const created = await withUserRls(auth.session.access_token, async (tx) => {
      const exists = await assertProspectExists(tx, parsedId.data)
      if (!exists) return { notFound: true as const }
      const [row] = await tx
        .insert(meetings)
        .values({
          prospectId: parsedId.data,
          organiserId: auth.user.id,
          assigneeId: body.assigneeId ?? auth.user.id,
          title: body.title.trim(),
          startsAt: new Date(body.startsAt),
          endsAt: body.endsAt ? new Date(body.endsAt) : null,
          location: body.location?.trim() || null,
          contactId: body.contactId ?? null,
          notes: body.notes?.trim() || null,
        })
        .returning()
      return { notFound: false as const, row }
    })
    if (created.notFound) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    return NextResponse.json({ meeting: rowToMeetingDto(created.row) }, { status: 201 })
  } catch (err) {
    console.error('[api/prospects/:id/meetings POST] failed', err)
    return NextResponse.json({ error: 'create_failed' }, { status: 500 })
  }
}
