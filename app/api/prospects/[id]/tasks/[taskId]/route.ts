import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { withUserRls } from '@/lib/db/rls'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import { activities, tasks } from '@/lib/db/schema'
import { updateTaskSchema, type TaskDTO } from '@/lib/tasks/schema'
import { getTask, rowToDto } from '@/lib/tasks/service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const idSchema = z.string().uuid()

interface RouteContext {
  params: Promise<{ id: string; taskId: string }>
}

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  const { id, taskId } = await ctx.params
  const parsedId = idSchema.safeParse(id)
  const parsedTask = idSchema.safeParse(taskId)
  if (!parsedId.success || !parsedTask.success) {
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
  const parsed = updateTaskSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', issues: parsed.error.issues },
      { status: 400 },
    )
  }
  const body = parsed.data

  try {
    const outcome = await withUserRls(session.access_token, async (tx) => {
      const existing = await getTask(tx, parsedTask.data)
      if (!existing) {
        return { ok: false as const, status: 404, body: { error: 'not_found' } }
      }
      if (existing.prospectId !== parsedId.data) {
        return { ok: false as const, status: 404, body: { error: 'not_found' } }
      }

      const patch: Partial<typeof tasks.$inferInsert> = {}
      if (body.title !== undefined) patch.title = body.title
      if (body.assigneeId !== undefined) patch.assigneeId = body.assigneeId
      if (body.playbookId !== undefined) patch.playbookId = body.playbookId
      if (body.dueAt !== undefined) {
        patch.dueAt = body.dueAt ? new Date(body.dueAt) : null
      }

      let movingToDone = false
      if (body.status !== undefined) {
        patch.status = body.status
        if (body.status === 'done' && existing.status !== 'done') {
          movingToDone = true
          patch.completedAt = new Date()
        }
        if (body.status !== 'done' && existing.completedAt) {
          patch.completedAt = null
        }
      }

      const updated = await tx
        .update(tasks)
        .set(patch)
        .where(eq(tasks.id, parsedTask.data))
        .returning()
      if (updated.length === 0) {
        return { ok: false as const, status: 403, body: { error: 'forbidden' } }
      }
      const dto = rowToDto(updated[0])

      if (movingToDone && dto.prospectId) {
        // Write the task_completed activity inside the same RLS-bound tx so a
        // sales rep with completion rights also gets the audit row written
        // (their activities_sales_insert policy allows actor_id = auth.uid()).
        await tx.insert(activities).values({
          prospectId: dto.prospectId,
          actorId: user.id,
          type: 'task_completed',
          payload: {
            taskId: dto.id,
            title: dto.title,
            dueAt: dto.dueAt,
          } as Record<string, unknown>,
        })
      }

      return { ok: true as const, task: dto satisfies TaskDTO }
    })

    if (!outcome.ok) {
      return NextResponse.json(outcome.body, { status: outcome.status })
    }
    return NextResponse.json({ task: outcome.task })
  } catch (err) {
    console.error('[api/prospects/:id/tasks/:taskId PATCH] failed', err)
    return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const { id, taskId } = await ctx.params
  const parsedId = idSchema.safeParse(id)
  const parsedTask = idSchema.safeParse(taskId)
  if (!parsedId.success || !parsedTask.success) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth
  const { session } = auth

  try {
    const outcome = await withUserRls(session.access_token, async (tx) => {
      const existing = await getTask(tx, parsedTask.data)
      if (!existing) {
        return { ok: false as const, status: 404, body: { error: 'not_found' } }
      }
      if (existing.prospectId !== parsedId.data) {
        return { ok: false as const, status: 404, body: { error: 'not_found' } }
      }
      const deleted = await tx
        .delete(tasks)
        .where(eq(tasks.id, parsedTask.data))
        .returning({ id: tasks.id })
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
    console.error('[api/prospects/:id/tasks/:taskId DELETE] failed', err)
    return NextResponse.json({ error: 'delete_failed' }, { status: 500 })
  }
}
