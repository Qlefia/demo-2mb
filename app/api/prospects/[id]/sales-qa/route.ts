import { NextRequest, NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { withUserRls } from '@/lib/db/rls'
import { prospectSalesQa } from '@/lib/db/schema'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth
  const { id: prospectId } = await ctx.params

  try {
    const items = await withUserRls(auth.session.access_token, async (tx) => {
      return tx
        .select()
        .from(prospectSalesQa)
        .where(eq(prospectSalesQa.prospectId, prospectId))
        .orderBy(desc(prospectSalesQa.createdAt))
    })
    return NextResponse.json({ items })
  } catch (err) {
    console.error('[api/prospects/.../sales-qa GET]', err)
    return NextResponse.json({ error: 'query_failed' }, { status: 500 })
  }
}

const postSchema = z
  .object({
    question: z.string().min(1).max(4000),
    answer: z.string().max(8000).optional(),
  })
  .strict()

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth
  const { id: prospectId } = await ctx.params

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const parsed = postSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body', issues: parsed.error.issues }, { status: 400 })
  }

  try {
    const [row] = await withUserRls(auth.session.access_token, async (tx) => {
      return tx
        .insert(prospectSalesQa)
        .values({
          prospectId,
          question: parsed.data.question,
          answer: parsed.data.answer ?? null,
          createdBy: auth.user.id,
        })
        .returning()
    })
    return NextResponse.json({ item: row }, { status: 201 })
  } catch (err) {
    console.error('[api/prospects/.../sales-qa POST]', err)
    return NextResponse.json({ error: 'create_failed' }, { status: 500 })
  }
}
