/** Workspace Settings → General → Offices: list lives inside the General page, detail is its own route. */
export const STUDIO_OFFICES_BASE = '/settings/studio/offices' as const

export function studioOfficeDetailPath(officeId: string): string {
  return `${STUDIO_OFFICES_BASE}/${officeId}`
}

const OFFICE_DETAIL_RE = /^\/settings\/studio\/offices\/([^/]+)$/

export function isStudioOfficeDetailPath(pathname: string): boolean {
  return OFFICE_DETAIL_RE.test(pathname)
}

export function studioOfficeIdFromPath(pathname: string): string | null {
  const m = pathname.match(OFFICE_DETAIL_RE)
  return m?.[1] ?? null
}
