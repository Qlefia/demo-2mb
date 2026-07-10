import { NextResponse } from 'next/server'
import { z } from 'zod'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import { loadProspectHeaderForUser } from '@/lib/prospects/headerData'

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
    const header = await loadProspectHeaderForUser(auth.supabase, parsedId.data)
    if (!header) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    return NextResponse.json(header)
  } catch (err) {
    console.error('[api/prospects/:id/header GET] failed', err)
    return NextResponse.json({ error: 'query_failed' }, { status: 500 })
  }
}
