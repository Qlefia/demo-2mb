/**
 * Studio workspace — Brand top-level section.
 *
 * Mirrors the Sales pattern (sub-nav driven by pathname, deep-linkable tabs).
 * Brand is a sibling of Sales now: data still lives in
 * `studio_profile.general.studioBrands` but the UI is no longer nested under
 * General to avoid an awkward double-tab structure.
 */
export const STUDIO_BRAND_BASE = '/settings/studio/brand' as const

export const STUDIO_BRAND_GENERAL = `${STUDIO_BRAND_BASE}/general`
export const STUDIO_BRAND_LOGOS = `${STUDIO_BRAND_BASE}/logos`
export const STUDIO_BRAND_COLORS = `${STUDIO_BRAND_BASE}/colors`
export const STUDIO_BRAND_FONTS = `${STUDIO_BRAND_BASE}/fonts`
export const STUDIO_BRAND_NETWORKS = `${STUDIO_BRAND_BASE}/networks`
export const STUDIO_BRAND_VOICE = `${STUDIO_BRAND_BASE}/voice`
export const STUDIO_BRAND_STRATEGY = `${STUDIO_BRAND_BASE}/strategy`
export const STUDIO_BRAND_BUSINESS = `${STUDIO_BRAND_BASE}/business`

export function isStudioBrandPath(pathname: string): boolean {
  return pathname === STUDIO_BRAND_BASE || pathname.startsWith(`${STUDIO_BRAND_BASE}/`)
}

export type StudioBrandSubTab =
  | 'general'
  | 'logos'
  | 'colors'
  | 'fonts'
  | 'networks'
  | 'voice'
  | 'strategy'
  | 'business'

/**
 * Resolve the active brand sub-tab from the pathname.
 *
 * Defaults to `'general'` for `/settings/studio/brand` (bare base) so the
 * top-level link in the studio nav always lands on a real panel without a
 * Next.js redirect round-trip.
 */
export function studioBrandSubTabFromPath(pathname: string): StudioBrandSubTab {
  if (pathname === STUDIO_BRAND_LOGOS) return 'logos'
  if (pathname === STUDIO_BRAND_COLORS) return 'colors'
  if (pathname === STUDIO_BRAND_FONTS) return 'fonts'
  if (pathname === STUDIO_BRAND_NETWORKS) return 'networks'
  if (pathname === STUDIO_BRAND_VOICE) return 'voice'
  if (pathname === STUDIO_BRAND_STRATEGY) return 'strategy'
  if (pathname === STUDIO_BRAND_BUSINESS) return 'business'
  return 'general'
}
