import { NextRequest, NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { withUserRls } from '@/lib/db/rls'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import { deals } from '@/lib/db/schema'
import { DEAL_STAGES } from '@/lib/db/schema/enums'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const uuid = z.string().uuid()

interface RouteContext {
  params: Promise<{ id: string; dealId: string }>
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

const patchSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    value: z.number().nonnegative().nullable().optional(),
    currency: z.string().min(3).max(3).optional(),
    stage: z.enum(DEAL_STAGES).optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: 'no_changes' })

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  const { id, dealId } = await ctx.params
  const prospectId = uuid.safeParse(id)
  const dId = uuid.safeParse(dealId)
  if (!prospectId.success || !dId.success) {
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
  const parsed = patchSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', issues: parsed.error.issues },
      { status: 400 },
    )
  }
  const patch = parsed.data

  try {
    const result = await withUserRls(auth.session.access_token, async (tx) => {
      const existing = await tx
        .select()
        .from(deals)
        .where(and(eq(deals.id, dId.data), eq(deals.prospectId, prospectId.data)))
        .limit(1)
      if (existing.length === 0) return { notFound: true as const }

      const update: Partial<typeof deals.$inferInsert> = {}
      if (patch.title !== undefined) update.title = patch.title.trim()
      if (patch.currency !== undefined) update.currency = patch.currency
      if (patch.stage !== undefined) update.stage = patch.stage
      if (patch.value !== undefined) {
        update.value =
          patch.value === null ? null : (String(patch.value) as unknown as typeof deals.$inferInsert.value)
      }

      const [row] = await tx
        .update(deals)
        .set(update)
        .where(and(eq(deals.id, dId.data), eq(deals.prospectId, prospectId.data)))
        .returning()
      return { notFound: false as const, row }
    })

    if (result.notFound || !result.row) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    return NextResponse.json({ deal: rowToJson(result.row) })
  } catch (err) {
    console.error('[api/prospects/:id/deals/:dealId PATCH] failed', err)
    return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const { id, dealId } = await ctx.params
  const prospectId = uuid.safeParse(id)
  const dId = uuid.safeParse(dealId)
  if (!prospectId.success || !dId.success) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  try {
    const result = await withUserRls(auth.session.access_token, async (tx) => {
      const removed = await tx
        .delete(deals)
        .where(and(eq(deals.id, dId.data), eq(deals.prospectId, prospectId.data)))
        .returning({ id: deals.id })
      return removed.length > 0
    })
    if (!result) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/prospects/:id/deals/:dealId DELETE] failed', err)
    return NextResponse.json({ error: 'delete_failed' }, { status: 500 })
  }
}
