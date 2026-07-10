import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  TERRITORIES,
  isAuthorizedUser,
  pickCrmRole,
  pickTerritory,
  requireRole,
  type CrmRole,
} from '@/lib/auth/roles'
import { deriveDisplayName, deriveSeatStatus, listAllUsers } from '@/lib/team/seatService'
import type { AssignableOwner } from '@/lib/team/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ASSIGNABLE_ROLES: readonly CrmRole[] = ['founder', 'ops', 'sales_de', 'sales_uk']

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const auth = await requireRole(supabase, ['founder', 'ops', 'admin', 'sales_de', 'sales_uk'])
  if (!isAuthorizedUser(auth)) return auth

  const territoryParam = new URL(request.url).searchParams.get('territory')
  const territoryFilter = territoryParam && (TERRITORIES as readonly string[]).includes(territoryParam)
    ? (territoryParam as (typeof TERRITORIES)[number])
    : null

  let users
  try {
    users = await listAllUsers()
  } catch (err) {
    console.error('[api/team/assignable-owners] listUsers failed', err)
    return NextResponse.json({ error: 'list_failed' }, { status: 500 })
  }

  const owners: AssignableOwner[] = users
    .filter((u) => deriveSeatStatus(u) === 'active')
    .map((u) => ({
      id: u.id,
      displayName: deriveDisplayName(u),
      email: u.email ?? '',
      role: pickCrmRole((u.app_metadata ?? {}).role),
      territory: pickTerritory((u.app_metadata ?? {}).territory),
    }))
    .filter((o) => o.role !== null && ASSIGNABLE_ROLES.includes(o.role))
    .filter((o) => {
      if (!territoryFilter) return true
      // Founder/ops are visible across all territories; sales-* must match.
      if (o.role === 'founder' || o.role === 'ops') return true
      return o.territory === territoryFilter
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName))

  return NextResponse.json({ owners })
}
