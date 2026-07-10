import { NextResponse } from 'next/server'
import { ensureDefaultWorkspaceMembershipForUser } from '@/lib/workspace/ensureDefaultMembership'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Idempotent: attach current user to default workspace (RLS prerequisite). */
export async function POST() {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  await ensureDefaultWorkspaceMembershipForUser(auth.user.id)
  return NextResponse.json({ ok: true })
}
