import 'server-only'

import type { SupabaseClient, User } from '@supabase/supabase-js'

export const CRM_ROLES = ['founder', 'ops', 'sales_de', 'sales_uk', 'admin'] as const
export type CrmRole = (typeof CRM_ROLES)[number]

export const TERRITORIES = ['DE', 'UK'] as const
export type Territory = (typeof TERRITORIES)[number]

export function pickCrmRole(value: unknown): CrmRole | null {
  return typeof value === 'string' && (CRM_ROLES as readonly string[]).includes(value)
    ? (value as CrmRole)
    : null
}

export function pickTerritory(value: unknown): Territory | null {
  return value === 'DE' || value === 'UK' ? value : null
}

export function getRoleFromUser(user: User): CrmRole | null {
  return pickCrmRole((user.app_metadata ?? {}).role)
}

export function getTerritoryFromUser(user: User): Territory | null {
  return pickTerritory((user.app_metadata ?? {}).territory)
}

export interface AuthorizedUser {
  user: User
  role: CrmRole | null
  territory: Territory | null
}

/**
 * Reads the authenticated user and asserts a role membership. Returns either
 * an AuthorizedUser (caller continues) or a Response (caller returns it).
 *
 * Centralised so every /api/team/* and /api/prospects PATCH handler does the
 * same thing the same way. RLS still gates DB access, but Admin API calls
 * (service role) need an app-level gate before invoking.
 */
export async function requireRole(
  supabase: SupabaseClient,
  allowed: readonly CrmRole[],
): Promise<AuthorizedUser | Response> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return Response.json({ error: 'unauthenticated' }, { status: 401 })
  }

  const role = getRoleFromUser(user)
  if (!role || !allowed.includes(role)) {
    return Response.json({ error: 'forbidden', role }, { status: 403 })
  }

  return { user, role, territory: getTerritoryFromUser(user) }
}

export function isAuthorizedUser(value: AuthorizedUser | Response): value is AuthorizedUser {
  return !(value instanceof Response)
}
