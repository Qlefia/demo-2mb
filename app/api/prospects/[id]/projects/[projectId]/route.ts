import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { withUserRls } from '@/lib/db/rls'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import { clientProjects } from '@/lib/db/schema'
import { updateClientProjectSchema } from '@/lib/client-projects/schema'
import { getClientProjectForProspect } from '@/lib/client-projects/service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const idSchema = z.string().uuid()

interface RouteContext {
  params: Promise<{ id: string; projectId: string }>
}

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { id, projectId } = await ctx.params
  const parsedProspect = idSchema.safeParse(id)
  const parsedProject = idSchema.safeParse(projectId)
  if (!parsedProspect.success || !parsedProject.success) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  try {
    const project = await withUserRls(auth.session.access_token, async (tx) =>
      getClientProjectForProspect(tx, parsedProspect.data, parsedProject.data),
    )
    if (!project) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    return NextResponse.json({ project })
  } catch (err) {
    console.error('[api/prospects/:id/projects/:projectId GET] failed', err)
    return NextResponse.json({ error: 'query_failed' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  const { id, projectId } = await ctx.params
  const parsedProspect = idSchema.safeParse(id)
  const parsedProject = idSchema.safeParse(projectId)
  if (!parsedProspect.success || !parsedProject.success) {
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
  const parsed = updateClientProjectSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', issues: parsed.error.issues },
      { status: 400 },
    )
  }
  const body = parsed.data

  try {
    const updated = await withUserRls(auth.session.access_token, async (tx) => {
      const existing = await getClientProjectForProspect(
        tx,
        parsedProspect.data,
        parsedProject.data,
      )
      if (!existing) return null

      const patch: Record<string, unknown> = {}
      if (body.title !== undefined) patch.title = body.title.trim()
      if (body.description !== undefined) patch.description = body.description?.trim() || null
      if (body.status !== undefined) patch.status = body.status
      if (body.currency !== undefined) patch.currency = body.currency
      if (body.estimatedValue !== undefined) {
        patch.estimatedValue =
          body.estimatedValue != null ? String(body.estimatedValue) : null
      }
      if (body.lostReason !== undefined) patch.lostReason = body.lostReason
      if (body.status === 'offer_declined' || body.status === 'cancelled') {
        patch.lostAt = new Date()
      }

      await tx
        .update(clientProjects)
        .set(patch)
        .where(eq(clientProjects.id, parsedProject.data))

      return getClientProjectForProspect(tx, parsedProspect.data, parsedProject.data)
    })

    if (!updated) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    return NextResponse.json({ project: updated })
  } catch (err) {
    console.error('[api/prospects/:id/projects/:projectId PATCH] failed', err)
    return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  }
}
