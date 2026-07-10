import { NextResponse, type NextRequest } from 'next/server'
import { readSessionIdFromAccessToken } from '@/lib/auth/sessionId'
import { deleteAuthSessionForUser } from '@/lib/auth/userSessions'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ sessionId: string }> }

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  const { sessionId } = await context.params
  if (!sessionId) {
    return NextResponse.json({ error: 'invalid_session_id' }, { status: 400 })
  }

  const currentSessionId = readSessionIdFromAccessToken(auth.session.access_token)

  if (currentSessionId && sessionId === currentSessionId) {
    const { error } = await auth.supabase.auth.signOut({ scope: 'local' })
    if (error) {
      return NextResponse.json({ error: 'sign_out_failed' }, { status: 500 })
    }
    return NextResponse.json({ signedOutCurrent: true })
  }

  const deleted = await deleteAuthSessionForUser(auth.user.id, sessionId)
  if (!deleted) {
    return NextResponse.json({ error: 'session_not_found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
