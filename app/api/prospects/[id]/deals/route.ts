import { NextRequest, NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { withUserRls } from '@/lib/db/rls'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import { deals, prospects } from '@/lib/db/schema'
import { DEAL_STAGES } from '@/lib/db/schema/enums'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const idSchema = z.string().uuid()

interface RouteContext {
  params: Promise<{ id: string }>
}

function rowToJson(row: typeof deals.$inferSelect) {
  const c = row.createdAt as unknown as Date | string
  const u = row.updatedAt as unknown as Date | string
  return {
    id: row.id,
    prospectId: row.prospectId,
    title: row.title,
    value: row.value != null ? String(row.value) : null,
    currency: row.currency,
    stage: row.stage,
    createdAt: c instanceof Date ? c.toISOString() : new Date(c).toISOString(),
    updatedAt: u instanceof Date ? u.toISOString() : new Date(u).toISOString(),
  }
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
      const ok = await tx
        .select({ id: prospects.id })
        .from(prospects)
        .where(eq(prospects.id, parsedId.data))
        .limit(1)
      if (ok.length === 0) return null
      const rows = await tx
        .select()
        .from(deals)
        .where(eq(deals.prospectId, parsedId.data))
        .orderBy(desc(deals.createdAt))
      return rows.map(rowToJson)
    })
    if (items === null) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    return NextResponse.json({ items })
  } catch (err) {
    console.error('[api/prospects/:id/deals GET] failed', err)
    return NextResponse.json({ error: 'query_failed' }, { status: 500 })
  }
}

const postSchema = z
  .object({
    title: z.string().min(1).max(200),
    value: z.number().nonnegative().optional().nullable(),
    currency: z.string().min(3).max(3).default('EUR'),
    stage: z.enum(DEAL_STAGES).optional(),
  })
  .strict()

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
  const parsed = postSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', issues: parsed.error.issues },
      { status: 400 },
    )
  }
  const body = parsed.data

  try {
    const created = await withUserRls(auth.session.access_token, async (tx) => {
      const ok = await tx
        .select({ id: prospects.id })
        .from(prospects)
        .where(eq(prospects.id, parsedId.data))
        .limit(1)
      if (ok.length === 0) return { notFound: true as const }
      const [row] = await tx
        .insert(deals)
        .values({
          prospectId: parsedId.data,
          title: body.title.trim(),
          value: body.value != null && body.value !== undefined ? String(body.value) : null,
          currency: body.currency,
          stage: body.stage ?? 'open',
        })
        .returning()
      return { notFound: false as const, row }
    })
    if (created.notFound) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    return NextResponse.json({ deal: rowToJson(created.row) }, { status: 201 })
  } catch (err) {
    console.error('[api/prospects/:id/deals POST] failed', err)
    return NextResponse.json({ error: 'create_failed' }, { status: 500 })
  }
}
