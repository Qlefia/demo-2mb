/**
 * Workspace Settings → Document templates (offer / proposal / invoice).
 *
 * Templates are surfaced through the Offer / Proposal / Invoicing tabs (each
 * tab renders `StudioTemplatesHubSection` filtered by `kind`), but every
 * template has the same edit screen at `/settings/studio/templates/[id]`. The
 * back-link returns to whichever tab matches the template `kind`.
 */
export const STUDIO_TEMPLATES_BASE = '/settings/studio/templates' as const

export function studioTemplateDetailPath(templateId: string): string {
  return `${STUDIO_TEMPLATES_BASE}/${templateId}`
}

const TEMPLATE_DETAIL_RE = /^\/settings\/studio\/templates\/([^/]+)$/

export function isStudioTemplateDetailPath(pathname: string): boolean {
  return TEMPLATE_DETAIL_RE.test(pathname)
}

export function studioTemplateIdFromPath(pathname: string): string | null {
  const m = pathname.match(TEMPLATE_DETAIL_RE)
  return m?.[1] ?? null
}
