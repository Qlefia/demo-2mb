import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'
import {
  CRM_ROLES,
  TERRITORIES,
  isAuthorizedUser,
  pickCrmRole,
  requireRole,
  type CrmRole,
} from '@/lib/auth/roles'
import { countFounderSeats, deriveSeatStatus, userToSeat } from '@/lib/team/seatService'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RouteContext {
  params: Promise<{ id: string }>
}

const patchSchema = z
  .object({
    displayName: z.string().min(1).max(120).optional(),
    role: z.enum(CRM_ROLES).optional(),
    territory: z.enum(TERRITORIES).nullable().optional(),
    active: z.boolean().optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.displayName !== undefined ||
      data.role !== undefined ||
      data.territory !== undefined ||
      data.active !== undefined,
    { message: 'empty_patch' },
  )

// 100 years; effectively permanent ban unless reactivated.
const DEACTIVATE_BAN_DURATION = '876000h'

export async function PATCH(request: NextRequest, context: RouteContext) {
  const supabase = await createClient()
  const auth = await requireRole(supabase, ['founder'])
  if (!isAuthorizedUser(auth)) return auth

  const { id } = await context.params

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body', issues: parsed.error.issues }, { status: 400 })
  }

  if (id === auth.user.id && parsed.data.role !== undefined && parsed.data.role !== auth.role) {
    return NextResponse.json({ error: 'cannot_change_own_role' }, { status: 422 })
  }
  if (id === auth.user.id && parsed.data.active === false) {
    return NextResponse.json({ error: 'cannot_deactivate_self' }, { status: 422 })
  }

  const service = getServiceClient()
  const { data: existing, error: fetchError } = await service.auth.admin.getUserById(id)
  if (fetchError || !existing.user) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const currentRole = pickCrmRole((existing.user.app_metadata ?? {}).role)
  const nextRole: CrmRole | null = (parsed.data.role ?? currentRole) as CrmRole | null

  // Last-founder lockout guard: cannot demote or deactivate the only founder.
  if (currentRole === 'founder') {
    const willStopBeingFounder = parsed.data.role !== undefined && parsed.data.role !== 'founder'
    const willDeactivate = parsed.data.active === false
    if (willStopBeingFounder || willDeactivate) {
      const founderCount = await countFounderSeats()
      if (founderCount <= 1) {
        return NextResponse.json({ error: 'last_founder' }, { status: 422 })
      }
    }
  }

  const currentAppMeta = (existing.user.app_metadata ?? {}) as Record<string, unknown>
  const nextAppMeta: Record<string, unknown> = { ...currentAppMeta }
  if (parsed.data.role !== undefined) nextAppMeta.role = parsed.data.role
  if (parsed.data.territory !== undefined) nextAppMeta.territory = parsed.data.territory

  // Sales seats must always have a matching territory.
  if (nextRole === 'sales_de') nextAppMeta.territory = 'DE'
  if (nextRole === 'sales_uk') nextAppMeta.territory = 'UK'

  const updatePayload: Record<string, unknown> = {
    app_metadata: nextAppMeta,
  }

  if (parsed.data.displayName !== undefined) {
    const currentUserMeta = (existing.user.user_metadata ?? {}) as Record<string, unknown>
    updatePayload.user_metadata = { ...currentUserMeta, display_name: parsed.data.displayName }
  }

  if (parsed.data.active !== undefined) {
    updatePayload.ban_duration = parsed.data.active ? 'none' : DEACTIVATE_BAN_DURATION
  }

  const { data: updated, error: updateError } = await service.auth.admin.updateUserById(
    id,
    updatePayload,
  )

  if (updateError || !updated.user) {
    return NextResponse.json(
      { error: 'update_failed', message: updateError?.message ?? 'unknown' },
      { status: 500 },
    )
  }

  return NextResponse.json({ seat: userToSeat(updated.user) })
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const supabase = await createClient()
  const auth = await requireRole(supabase, ['founder'])
  if (!isAuthorizedUser(auth)) return auth

  const { id } = await context.params
  if (id === auth.user.id) {
    return NextResponse.json({ error: 'cannot_delete_self' }, { status: 422 })
  }

  const service = getServiceClient()
  const { data: existing, error: fetchError } = await service.auth.admin.getUserById(id)
  if (fetchError || !existing.user) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  // Hard-delete is only safe for seats that never logged in (no audit trail
  // is destroyed). Active/deactivated seats must be deactivated instead.
  if (deriveSeatStatus(existing.user) !== 'invited') {
    return NextResponse.json({ error: 'not_pending' }, { status: 409 })
  }

  const { error: deleteError } = await service.auth.admin.deleteUser(id)
  if (deleteError) {
    return NextResponse.json(
      { error: 'delete_failed', message: deleteError.message },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}
