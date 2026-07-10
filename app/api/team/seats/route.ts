import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'
import {
  TERRITORIES,
  isAuthorizedUser,
  pickCrmRole,
  requireRole,
  type CrmRole,
  type Territory,
} from '@/lib/auth/roles'
import { compareSeats, listAllUsers, userToSeat } from '@/lib/team/seatService'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const auth = await requireRole(supabase, ['founder', 'admin'])
  if (!isAuthorizedUser(auth)) return auth

  let users
  try {
    users = await listAllUsers()
  } catch (err) {
    console.error('[api/team/seats] listUsers failed', err)
    return NextResponse.json({ error: 'list_failed' }, { status: 500 })
  }

  const seats = users
    .filter((u) => pickCrmRole((u.app_metadata ?? {}).role) !== null)
    .map(userToSeat)
    .sort(compareSeats)

  return NextResponse.json({ seats })
}

const inviteSchema = z
  .object({
    email: z.string().email(),
    displayName: z.string().min(1).max(120),
    role: z.enum(['ops', 'sales_de', 'sales_uk', 'admin'] as const),
    territory: z.enum(TERRITORIES).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.role === 'sales_de' && data.territory !== 'DE') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['territory'],
        message: 'sales_de requires DE territory',
      })
    }
    if (data.role === 'sales_uk' && data.territory !== 'UK') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['territory'],
        message: 'sales_uk requires UK territory',
      })
    }
  })

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const auth = await requireRole(supabase, ['founder'])
  if (!isAuthorizedUser(auth)) return auth

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = inviteSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body', issues: parsed.error.issues }, { status: 400 })
  }

  const role: CrmRole = parsed.data.role
  const territory: Territory | null = parsed.data.territory ?? null
  const { email, displayName } = parsed.data

  const service = getServiceClient()
  const origin = new URL(request.url).origin

  const { data: invited, error: inviteError } = await service.auth.admin.inviteUserByEmail(email, {
    data: {
      display_name: displayName,
      language: 'de',
      timezone: 'Europe/Berlin',
    },
    redirectTo: `${origin}/auth/callback?next=/auth/accept-invite`,
  })

  if (inviteError || !invited.user) {
    const message = inviteError?.message ?? 'invite_failed'
    const status = /already.*registered|already.*exists/i.test(message) ? 409 : 500
    return NextResponse.json({ error: 'invite_failed', message }, { status })
  }

  const { data: updated, error: updateError } = await service.auth.admin.updateUserById(
    invited.user.id,
    {
      app_metadata: { role, territory },
    },
  )

  if (updateError || !updated.user) {
    return NextResponse.json(
      { error: 'metadata_failed', message: updateError?.message ?? 'unknown' },
      { status: 500 },
    )
  }

  return NextResponse.json({ seat: userToSeat(updated.user) }, { status: 201 })
}
