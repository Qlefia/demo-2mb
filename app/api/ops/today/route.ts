import { NextResponse } from 'next/server'
import { loadOpsTodaySnapshot } from '@/lib/ops/today'
import { withUserRls } from '@/lib/db/rls'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import { pickCrmRole } from '@/lib/auth/roles'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const OPS_ROLES = new Set(['founder', 'ops', 'admin'])

export async function GET() {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  const role = pickCrmRole((auth.user.app_metadata ?? {}).role)
  if (!role || !OPS_ROLES.has(role)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  try {
    const data = await withUserRls(auth.session.access_token, (tx) => loadOpsTodaySnapshot(tx))
    return NextResponse.json(data)
  } catch (err) {
    console.error('[api/ops/today] failed', err)
    const message = err instanceof Error ? err.message : 'unknown_error'
    const body =
      process.env.NODE_ENV === 'development'
        ? { error: 'query_failed', message }
        : { error: 'query_failed' }
    return NextResponse.json(body, { status: 500 })
  }
}
