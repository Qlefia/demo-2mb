import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { withUserRls } from '@/lib/db/rls'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import { tasks, prospects } from '@/lib/db/schema'
import { TASK_STATUSES, type TaskStatus } from '@/lib/db/schema/enums'
import { createTaskSchema } from '@/lib/tasks/schema'
import { listTasksForProspect, rowToDto } from '@/lib/tasks/service'

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
  const statusParam = url.searchParams.get('statuses')
  const statuses = statusParam
    ? statusParam
        .split(',')
        .map((s) => s.trim())
        .filter((s): s is TaskStatus => (TASK_STATUSES as readonly string[]).includes(s))
    : undefined

  try {
    const items = await withUserRls(auth.session.access_token, (tx) =>
      listTasksForProspect(tx, parsedId.data, { statuses }),
    )
    return NextResponse.json({ items })
  } catch (err) {
    console.error('[api/prospects/:id/tasks GET] failed', err)
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
  const parsed = createTaskSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', issues: parsed.error.issues },
      { status: 400 },
    )
  }
  const body = parsed.data

  try {
    const outcome = await withUserRls(auth.session.access_token, async (tx) => {
      const exists = await tx
        .select({ id: prospects.id })
        .from(prospects)
        .where(eq(prospects.id, parsedId.data))
        .limit(1)
      if (exists.length === 0) {
        return { ok: false as const, status: 404, body: { error: 'prospect_not_found' } }
      }
      const inserted = await tx
        .insert(tasks)
        .values({
          prospectId: parsedId.data,
          assigneeId: body.assigneeId,
          title: body.title,
          dueAt: body.dueAt ? new Date(body.dueAt) : null,
          playbookId: body.playbookId ?? null,
        })
        .returning()
      return { ok: true as const, task: rowToDto(inserted[0]) }
    })

    if (!outcome.ok) {
      return NextResponse.json(outcome.body, { status: outcome.status })
    }
    return NextResponse.json({ task: outcome.task }, { status: 201 })
  } catch (err) {
    console.error('[api/prospects/:id/tasks POST] failed', err)
    return NextResponse.json({ error: 'create_failed' }, { status: 500 })
  }
}
