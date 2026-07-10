/**
 * Client deck layout contract M1 (Phase 9 / QLE-78).
 * Screen preview, PDF (@react-pdf/renderer), and public HTML must honor these tokens.
 * Color values come from Brand kit via {@link deckTheme.ts} — not hardcoded here.
 */
import type { ProposalBlock } from '@/lib/proposals/blockSchema'
import {
  DECK_THEME_FALLBACK,
  deckThemeToCssVars,
  letterheadThemeToCssVars,
  resolveDeckThemeFromBlocks,
  resolveDeckThemeFromCoverProps,
  type ProposalDeckTheme,
} from '@/lib/proposals/deckTheme'

export type { ProposalDeckTheme }
export { DECK_THEME_FALLBACK, deckThemeToCssVars, letterheadThemeToCssVars, resolveDeckThemeFromBlocks }

export const DECK_FONT_FAMILY = 'Inter'

/** Base unit for vertical rhythm (pt in PDF; px multiplier in HTML preview). */
export const DECK_BASE_PT = 11

export const DECK_TYPE_SCALE = {
  coverTitle: 28,
  coverSubtitle: 14,
  h1: 22,
  h2: 16,
  body: DECK_BASE_PT,
  small: 9,
  caption: 8,
} as const

/** Fixed row band height for visual_grid image rows in PDF (all cells in a row match). */
export const VISUAL_GRID_ROW_HEIGHT_PT = 220

/** A4 width in pt (react-pdf default). */
export const DECK_PAGE_WIDTH_PT = 595.28
export const DECK_PAGE_HEIGHT_PT = 841.89

/** Margins inside page (pt). */
export const DECK_PAGE_MARGIN_PT = 48

/** @deprecated Use {@link DECK_THEME_FALLBACK} or theme from cover block. */
export const DECK_COLORS = {
  bg: DECK_THEME_FALLBACK.bg,
  fg: DECK_THEME_FALLBACK.fg,
  muted: DECK_THEME_FALLBACK.muted,
  accent: DECK_THEME_FALLBACK.accent,
  line: DECK_THEME_FALLBACK.line,
  surface: DECK_THEME_FALLBACK.surface,
  surfaceTint: DECK_THEME_FALLBACK.surfaceTint,
  panelPlum: DECK_THEME_FALLBACK.surfaceTint,
} as const

export const SERVICE_TAG_CHIP_BG = DECK_THEME_FALLBACK.tagChipBg
export const LETTERHEAD_LIGHT_BG = DECK_THEME_FALLBACK.letterheadBg
export const LETTERHEAD_LIGHT_FG = DECK_THEME_FALLBACK.letterheadFg
export const VISUAL_GRID_TEXT_CARD_BG = DECK_THEME_FALLBACK.surfaceTint
export const LETTERHEAD_SECTION_BG = DECK_THEME_FALLBACK.letterheadBg
export const LETTERHEAD_SECTION_FG = DECK_THEME_FALLBACK.letterheadFg
export const LETTERHEAD_SECTION_MUTED = DECK_THEME_FALLBACK.letterheadMuted
export const LETTERHEAD_SECTION_LINE = DECK_THEME_FALLBACK.letterheadLine
export const CASE_CARD_BG = DECK_THEME_FALLBACK.surface
export const RENDER_PLACEHOLDER_BG = DECK_THEME_FALLBACK.surfaceTint

export type DeckLanguage = 'de' | 'en'

/** Pricing table column titles — keep preview + PDF in sync with proposal language. */
export function pricingTableLabels(lang: DeckLanguage) {
  if (lang === 'de') {
    return { package: 'Paket', deliverables: 'Leistung', price: 'Preis' } as const
  }
  return { package: 'Package', deliverables: 'Deliverables', price: 'Price' } as const
}

/** Inline style map for HTML preview root — reads theme from cover block. */
export function deckCssVars(theme?: ProposalDeckTheme): Record<string, string> {
  return deckThemeToCssVars(theme ?? DECK_THEME_FALLBACK)
}

/** Override deck CSS variables for white-sheet sections (preview). */
export function letterheadSectionCssVars(theme?: ProposalDeckTheme): Record<string, string> {
  return letterheadThemeToCssVars(theme ?? DECK_THEME_FALLBACK)
}

export type DeckSectionSurface = 'deck' | 'letterhead'

export function resolveDeckAccentFromBlocks(blocks: ProposalBlock[]): string {
  return resolveDeckThemeFromBlocks(blocks).accent
}

export function resolveStudioLogoFromBlocks(blocks: ProposalBlock[]): string | null {
  const cover = blocks.find((b) => b.type === 'cover')
  if (cover?.type !== 'cover') return null
  const url = cover.props.studioLogoUrl?.trim()
  return url || null
}

export { resolveDeckThemeFromCoverProps }
