import 'server-only'

import type { User } from '@supabase/supabase-js'
import { getServiceClient } from '@/lib/supabase/service'
import { pickCrmRole, pickTerritory } from '@/lib/auth/roles'
import type { Seat, SeatStatus } from '@/lib/team/types'

function isBanned(user: User): boolean {
  const raw = (user as unknown as { banned_until?: string | null }).banned_until
  if (!raw) return false
  const ts = Date.parse(raw)
  return Number.isFinite(ts) && ts > Date.now()
}

export function deriveSeatStatus(user: User): SeatStatus {
  if (isBanned(user)) return 'deactivated'
  if (user.email_confirmed_at || user.last_sign_in_at) return 'active'
  return 'invited'
}

export function deriveDisplayName(user: User): string {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const display = typeof meta.display_name === 'string' ? meta.display_name.trim() : ''
  if (display) return display
  const email = user.email ?? ''
  return email.includes('@') ? email.split('@')[0] : email
}

export function userToSeat(user: User): Seat {
  const appMeta = (user.app_metadata ?? {}) as Record<string, unknown>
  return {
    id: user.id,
    email: user.email ?? '',
    displayName: deriveDisplayName(user),
    role: pickCrmRole(appMeta.role),
    territory: pickTerritory(appMeta.territory),
    status: deriveSeatStatus(user),
    lastSignInAt: user.last_sign_in_at ?? null,
    createdAt: user.created_at,
    invitedAt: user.invited_at ?? null,
  }
}

/**
 * Iterates Supabase Admin API listUsers across pages. Capped at 5000 users
 * (25 pages × 200) — single-tenant CRM does not need more.
 */
export async function listAllUsers(): Promise<User[]> {
  const service = getServiceClient()
  const collected: User[] = []
  let page = 1
  for (;;) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    collected.push(...data.users)
    if (data.users.length < 200) break
    page += 1
    if (page > 25) break
  }
  return collected
}

export function compareSeats(a: Seat, b: Seat): number {
  if (a.role === 'founder' && b.role !== 'founder') return -1
  if (b.role === 'founder' && a.role !== 'founder') return 1
  return a.displayName.localeCompare(b.displayName)
}

export async function countFounderSeats(): Promise<number> {
  const users = await listAllUsers()
  return users.filter((u) => pickCrmRole((u.app_metadata ?? {}).role) === 'founder').length
}
