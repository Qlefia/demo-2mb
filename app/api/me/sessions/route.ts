import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { readSessionIdFromAccessToken } from '@/lib/auth/sessionId'
import { listAuthSessionsForUser } from '@/lib/auth/userSessions'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  try {
    const currentSessionId = readSessionIdFromAccessToken(auth.session.access_token)
    const sessions = await listAuthSessionsForUser(auth.user.id, currentSessionId)

    return NextResponse.json({
      currentSessionId,
      sessions: sessions.map((session) => ({
        id: session.id,
        isCurrent: currentSessionId != null && session.id === currentSessionId,
        createdAt: session.createdAt,
        lastActiveAt: session.lastActiveAt,
        userAgent: session.userAgent,
        ip: session.ip,
      })),
    })
  } catch (err) {
    console.error('[me/sessions] list failed', err)
    return NextResponse.json({ error: 'sessions_unavailable' }, { status: 500 })
  }
}

const deleteBodySchema = z.object({
  scope: z.enum(['others', 'global']),
})

export async function DELETE(request: NextRequest) {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = deleteBodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const { error } = await auth.supabase.auth.signOut({
    scope: parsed.data.scope,
  })

  if (error) {
    return NextResponse.json({ error: 'sign_out_failed' }, { status: 500 })
  }

  return NextResponse.json({
    signedOut: parsed.data.scope === 'global',
  })
}
