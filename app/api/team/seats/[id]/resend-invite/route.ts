import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'
import { isAuthorizedUser, requireRole } from '@/lib/auth/roles'
import { deriveSeatStatus, userToSeat } from '@/lib/team/seatService'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  const supabase = await createClient()
  const auth = await requireRole(supabase, ['founder'])
  if (!isAuthorizedUser(auth)) return auth

  const { id } = await context.params

  const service = getServiceClient()
  const { data: existing, error: fetchError } = await service.auth.admin.getUserById(id)
  if (fetchError || !existing.user) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  if (deriveSeatStatus(existing.user) !== 'invited') {
    return NextResponse.json({ error: 'not_invited' }, { status: 409 })
  }
  if (!existing.user.email) {
    return NextResponse.json({ error: 'missing_email' }, { status: 422 })
  }

  const origin = new URL(request.url).origin
  const { data, error } = await service.auth.admin.inviteUserByEmail(existing.user.email, {
    redirectTo: `${origin}/auth/callback?next=/auth/accept-invite`,
  })

  if (error || !data.user) {
    return NextResponse.json(
      { error: 'resend_failed', message: error?.message ?? 'unknown' },
      { status: 500 },
    )
  }

  return NextResponse.json({ seat: userToSeat(data.user) })
}
