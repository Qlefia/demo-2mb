import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withUserRls } from '@/lib/db/rls'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import { clientProjects } from '@/lib/db/schema'
import {
  createClientProjectSchema,
  rowToClientProjectDto,
} from '@/lib/client-projects/schema'
import {
  assertProspectExists,
  listClientProjectsForProspect,
} from '@/lib/client-projects/service'

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
      return listClientProjectsForProspect(tx, parsedId.data)
    })
    if (items === null) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    return NextResponse.json({ items })
  } catch (err) {
    console.error('[api/prospects/:id/projects GET] failed', err)
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
  const parsed = createClientProjectSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', issues: parsed.error.issues },
      { status: 400 },
    )
  }
  const body = parsed.data

  try {
    const created = await withUserRls(auth.session.access_token, async (tx) => {
      const prospect = await assertProspectExists(tx, parsedId.data)
      if (!prospect) return { notFound: true as const }
      const [row] = await tx
        .insert(clientProjects)
        .values({
          prospectId: parsedId.data,
          workspaceId: prospect.workspaceId,
          title: body.title.trim(),
          description: body.description?.trim() || null,
          currency: body.currency,
          estimatedValue:
            body.estimatedValue != null && body.estimatedValue !== undefined
              ? String(body.estimatedValue)
              : null,
        })
        .returning()
      return { notFound: false as const, row }
    })
    if (created.notFound) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    return NextResponse.json(
      { project: rowToClientProjectDto(created.row, []) },
      { status: 201 },
    )
  } catch (err) {
    console.error('[api/prospects/:id/projects POST] failed', err)
    return NextResponse.json({ error: 'create_failed' }, { status: 500 })
  }
}
