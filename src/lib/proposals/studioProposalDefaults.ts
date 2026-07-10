import { resolveDeckThemeFromBrand, type ProposalDeckTheme } from '@/lib/proposals/deckTheme'
import { stripHtmlToPlain } from '@/features/studio-settings/lib/stripHtmlToPlain'
import { resolveBrandTheme } from '@/features/studio-settings/lib/studioBrandTheme'
import type { ProposalDeckFonts } from '@/features/proposals/lib/proposalDeckFonts'
import type { DeckLanguage } from '@/lib/proposals/deckLayout'
import { PROPOSAL_DEFAULT_VALIDITY_DAYS } from '@/lib/proposals/proposalDefaults'
import type { StudioBrandProfile } from '@/stores/studioProfileTypes'

export type StudioProposalDefaults = {
  coverHeadline: string | null
  coverSubtitle: string | null
  studioLogoUrl: string | null
  deckTheme: ProposalDeckTheme | null
  deckFonts: ProposalDeckFonts | null
  aboutTitle: string | null
  aboutBody: string | null
  termsBody: string | null
  validityDays: number | null
}

function strField(raw: unknown, max = 20_000): string {
  if (typeof raw !== 'string') return ''
  return raw.trim().slice(0, max)
}

function parseOfferValidityDays(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null
  const n = Number.parseInt(String(raw), 10)
  if (!Number.isFinite(n) || n < 1 || n > 365) return null
  return n
}

function parseStudioBrands(raw: unknown): StudioBrandProfile[] {
  if (!Array.isArray(raw)) return []
  return raw as StudioBrandProfile[]
}

function buildTermsBody(g: Record<string, unknown>): string | null {
  const parts = [
    strField(g.defaultPaymentTerms, 8_000),
    strField(g.defaultVatNote, 8_000),
    strField(g.defaultRevisionsNote, 8_000),
  ].filter(Boolean)
  if (parts.length === 0) return null
  return parts.join('\n\n')
}

function pickCoverCopy(
  generalHeadline: string,
  generalSubtitle: string,
  brand: StudioBrandProfile | null,
  language: DeckLanguage,
): { headline: string | null; subtitle: string | null } {
  const headline =
    generalHeadline ||
    brand?.name.trim() ||
    null

  const subtitle =
    generalSubtitle ||
    brand?.slogan.trim() ||
    null

  if (!headline && !subtitle && brand?.description.trim()) {
    const plain = stripHtmlToPlain(brand.description, 240)
    if (plain.trim()) {
      return language === 'de'
        ? { headline: brand.name.trim() || null, subtitle: plain.trim() }
        : { headline: brand.name.trim() || null, subtitle: plain.trim() }
    }
  }

  return { headline: headline || null, subtitle: subtitle || null }
}

function pickPrimaryBrand(studioBrands: StudioBrandProfile[]): StudioBrandProfile | null {
  if (studioBrands.length === 0) return null
  return studioBrands.find((b) => b.isPrimary) ?? studioBrands[0] ?? null
}

/** Studio workspace settings → proposal deck defaults (brand kit + general copy). */
export function buildStudioProposalDefaults(
  studioGeneral: unknown,
  language: DeckLanguage,
): StudioProposalDefaults | null {
  if (!studioGeneral || typeof studioGeneral !== 'object') return null
  const g = studioGeneral as Record<string, unknown>

  const studioBrands = parseStudioBrands(g.studioBrands)
  const brandKit = pickPrimaryBrand(studioBrands)
  const deckTheme = brandKit ? resolveDeckThemeFromBrand(brandKit) : null
  const brandTheme = brandKit ? resolveBrandTheme(brandKit) : null
  const theme = brandKit
    ? (() => {
        const logos = brandKit.logos
        const primary = logos.find((l) => l.role === 'primary' && l.imageDataUrl)
        const anyLogo = logos.find((l) => l.imageDataUrl)
        return { primaryLogoUrl: primary?.imageDataUrl ?? anyLogo?.imageDataUrl ?? null }
      })()
    : null

  const { headline, subtitle } = pickCoverCopy(
    strField(g.headline, 500),
    strField(g.subtitle, 1_000),
    brandKit,
    language,
  )

  const aboutRaw = strField(g.about, 20_000) || strField(g.advantages, 20_000)
  const aboutBody = aboutRaw
    ? stripHtmlToPlain(aboutRaw, 4_000).trim() || null
    : brandKit?.description
      ? stripHtmlToPlain(brandKit.description, 4_000).trim() || null
      : null

  const tradingName = strField(g.tradingName, 200)
  const aboutTitle = tradingName ? tradingName : brandKit?.name.trim() || null

  return {
    coverHeadline: headline,
    coverSubtitle: subtitle,
    studioLogoUrl: theme?.primaryLogoUrl ?? null,
    deckTheme,
    deckFonts: brandTheme
      ? {
          accentFontFamily: brandTheme.accentFontFamily,
          bodyFontFamily: brandTheme.bodyFontFamily,
          fonts: brandKit!.fonts,
        }
      : null,
    aboutTitle,
    aboutBody,
    termsBody: buildTermsBody(g),
    validityDays: parseOfferValidityDays(g.offerValidityDays),
  }
}

export function resolveProposalValidityDays(
  proposalValidity: number | null | undefined,
  studioDefaults: StudioProposalDefaults | null,
): number {
  if (typeof proposalValidity === 'number' && proposalValidity > 0) return proposalValidity
  if (studioDefaults?.validityDays) return studioDefaults.validityDays
  return PROPOSAL_DEFAULT_VALIDITY_DAYS
}
