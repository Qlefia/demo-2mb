import type { StudioBrandFont, StudioBrandProfile, StudioGeneral } from '@/stores/studioProfileTypes'
import { brandFontCssFamily } from '@/features/studio-settings/lib/studioBrandFontsCatalog'
import { resolveDeckThemeFromBrand } from '@/lib/proposals/deckTheme'

export type ResolvedBrandTheme = {
  kitId: string
  kitName: string
  primaryLogoUrl: string | null
  accentColor: string
  colors: StudioBrandProfile['colors']
  accentFont: StudioBrandFont | null
  bodyFont: StudioBrandFont | null
  accentFontFamily: string
  bodyFontFamily: string
}

const FALLBACK_BODY_FONT = 'Inter'

export function getPrimaryBrandKit(general: StudioGeneral): StudioBrandProfile | null {
  if (general.studioBrands.length === 0) return null
  return general.studioBrands.find((b) => b.isPrimary) ?? general.studioBrands[0] ?? null
}

function resolveFontFamily(font: StudioBrandFont | null, fallback: string): string {
  if (!font?.family.trim()) return fallback
  if (font.source === 'upload' && font.fontDataUrl) {
    return brandFontCssFamily(font.id, font.family)
  }
  return `"${font.family.replace(/"/g, '')}", ${fallback}`
}

function pickPrimaryLogo(brand: StudioBrandProfile): string | null {
  const primary = brand.logos.find((l) => l.role === 'primary' && l.imageDataUrl)
  if (primary?.imageDataUrl) return primary.imageDataUrl
  const any = brand.logos.find((l) => l.imageDataUrl)
  return any?.imageDataUrl ?? null
}

export function resolveBrandTheme(brand: StudioBrandProfile): ResolvedBrandTheme {
  const deckTheme = resolveDeckThemeFromBrand(brand)
  const accentFont = brand.accentFontId
    ? (brand.fonts.find((f) => f.id === brand.accentFontId) ?? null)
    : null
  const bodyFont = brand.bodyFontId
    ? (brand.fonts.find((f) => f.id === brand.bodyFontId) ?? null)
    : null

  return {
    kitId: brand.id,
    kitName: brand.name.trim() || 'Brand kit',
    primaryLogoUrl: pickPrimaryLogo(brand),
    accentColor: deckTheme.accent,
    colors: brand.colors,
    accentFont,
    bodyFont,
    accentFontFamily: resolveFontFamily(accentFont, FALLBACK_BODY_FONT),
    bodyFontFamily: resolveFontFamily(bodyFont, FALLBACK_BODY_FONT),
  }
}
