import { NextResponse } from 'next/server'
import { z } from 'zod'
import { env } from '@/lib/env'
import { runProspectEnrichment } from '@/lib/enrichment/orchestrator'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const OPS_ROLES = new Set(['founder', 'ops', 'admin'])

interface RouteContext {
  params: Promise<{ id: string }>
}

function isInternalEnrichRequest(request: Request): boolean {
  if (!env.ENRICH_INTERNAL_SECRET) return false
  const got = request.headers.get('x-enrichment-secret')
  return got != null && got === env.ENRICH_INTERNAL_SECRET
}

export async function POST(request: Request, ctx: RouteContext) {
  const { id } = await ctx.params
  const parsedId = z.string().uuid().safeParse(id)
  if (!parsedId.success) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }

  const internal = isInternalEnrichRequest(request)
  if (internal) {
    try {
      const result = await runProspectEnrichment(parsedId.data)
      if (!result.ok) {
        return NextResponse.json({ error: result.error ?? 'failed' }, { status: 422 })
      }
      return NextResponse.json({ ok: true })
    } catch (err) {
      console.error('[api/enrich internal]', err)
      return NextResponse.json({ error: 'server_error' }, { status: 500 })
    }
  }

  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  const role = (auth.user.app_metadata as { role?: string } | undefined)?.role
  if (!role || !OPS_ROLES.has(role)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  try {
    const result = await runProspectEnrichment(parsedId.data)
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? 'failed' }, { status: 422 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/enrich]', err)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
