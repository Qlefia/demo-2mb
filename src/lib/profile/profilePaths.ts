/**
 * Profile workspace paths.
 *
 * Mirrors the Studio Settings pattern (deep-linkable tabs driven by pathname).
 * The bare `/profile` base implicitly maps to `me` so `<Link href="/profile">`
 * in UserMenu still lands on a real panel without a redirect round-trip.
 */
export const PROFILE_BASE = '/profile' as const

export const PROFILE_ME = `${PROFILE_BASE}/me`
export const PROFILE_SECURITY = `${PROFILE_BASE}/security`
export const PROFILE_SESSIONS = `${PROFILE_BASE}/sessions`
export const PROFILE_DATA = `${PROFILE_BASE}/data`

export function isProfilePath(pathname: string): boolean {
  return pathname === PROFILE_BASE || pathname.startsWith(`${PROFILE_BASE}/`)
}

export type ProfileTab = 'me' | 'security' | 'sessions' | 'data'

export function profileTabFromPath(pathname: string): ProfileTab {
  if (pathname === PROFILE_SECURITY) return 'security'
  if (pathname === PROFILE_SESSIONS) return 'sessions'
  if (pathname === PROFILE_DATA) return 'data'
  return 'me'
}
