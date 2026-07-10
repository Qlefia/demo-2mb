import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { withUserRls } from '@/lib/db/rls'
import { enrichmentJobs } from '@/lib/db/schema'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const idSchema = z.string().uuid()

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params
  const parsedId = idSchema.safeParse(id)
  if (!parsedId.success) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }

  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  try {
    const items = await withUserRls(auth.session.access_token, async (tx) => {
      return tx
        .select({
          id: enrichmentJobs.id,
          provider: enrichmentJobs.provider,
          status: enrichmentJobs.status,
          error: enrichmentJobs.error,
          startedAt: enrichmentJobs.startedAt,
          finishedAt: enrichmentJobs.finishedAt,
          createdAt: enrichmentJobs.createdAt,
        })
        .from(enrichmentJobs)
        .where(eq(enrichmentJobs.prospectId, parsedId.data))
        .orderBy(desc(enrichmentJobs.createdAt))
        .limit(40)
    })

    return NextResponse.json({ items }, {
      headers: { 'Cache-Control': 'private, no-store, max-age=0' },
    })
  } catch (err) {
    console.error('[api/prospects/:id/enrichment-jobs]', err)
    return NextResponse.json({ error: 'query_failed' }, { status: 500 })
  }
}
