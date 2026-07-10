import type { StudioBrandFont } from '@/stores/studioProfileTypes'
import {
  brandFontCssFamily,
  googleFontStylesheetHref,
} from '@/features/studio-settings/lib/studioBrandFontsCatalog'

const FALLBACK_STACK = '"Inter", system-ui, sans-serif'

function injectUploadedFontFace(font: StudioBrandFont): void {
  if (font.source !== 'upload' || !font.fontDataUrl) return
  const id = `proposal-brand-font-face-${font.id}`
  if (document.getElementById(id)) return
  const style = document.createElement('style')
  style.id = id
  style.textContent = `@font-face{font-family:"brand-font-${font.id}";src:url("${font.fontDataUrl}");font-display:swap;}`
  document.head.appendChild(style)
}

function injectGoogleFontLink(family: string): void {
  const id = `proposal-brand-google-font-${family.replace(/\s+/g, '-')}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = googleFontStylesheetHref(family)
  document.head.appendChild(link)
}

export function injectProposalDeckFonts(fonts: StudioBrandFont[]): void {
  if (typeof document === 'undefined') return
  for (const font of fonts) {
    if (font.source === 'upload') injectUploadedFontFace(font)
    if (font.source === 'google') injectGoogleFontLink(font.family)
  }
}

export function resolveProposalFontFamily(font: StudioBrandFont | null): string {
  if (!font?.family.trim()) return FALLBACK_STACK
  if (font.source === 'upload' && font.fontDataUrl) {
    return brandFontCssFamily(font.id, font.family)
  }
  return `"${font.family.replace(/"/g, '')}", system-ui, sans-serif`
}

export type ProposalDeckFonts = {
  accentFontFamily: string
  bodyFontFamily: string
  fonts: StudioBrandFont[]
}

export function proposalDeckFontCssVars(fonts: ProposalDeckFonts): Record<string, string> {
  return {
    '--deck-font-accent': fonts.accentFontFamily,
    '--deck-font-body': fonts.bodyFontFamily,
  }
}
