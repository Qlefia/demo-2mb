import type { CrmRole } from '@/lib/auth/roles'

/** Full dossier edit (Ops/founder). */
export const DOSSIER_EDITOR_ROLES = new Set<CrmRole>(['founder', 'ops', 'admin'])

/** Contacts CRUD on prospect card. */
export const CONTACT_EDITOR_ROLES = new Set<CrmRole>([
  'founder',
  'ops',
  'admin',
  'sales_de',
  'sales_uk',
])

/** Activity composer (log call, email, note). */
export const ACTIVITY_COMPOSER_ROLES = new Set<CrmRole>([
  'founder',
  'ops',
  'admin',
  'sales_de',
  'sales_uk',
])

/** Ops-only actions: enrich, trigger add, triage. */
export const OPS_PRIVILEGED_ROLES = new Set<CrmRole>(['founder', 'ops', 'admin'])

export function hasRole(
  role: CrmRole | null | undefined,
  allowed: Set<CrmRole>,
): boolean {
  return role != null && allowed.has(role)
}
