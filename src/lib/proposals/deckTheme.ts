import type { StudioBrandColor, StudioBrandProfile } from '@/stores/studioProfileTypes'
import type { ProposalBlock } from '@/lib/proposals/blockSchema'
import { hexRelativeLuminance, mixHexColors } from '@/lib/proposals/deckColorUtils'

/** Semantic deck palette — sourced from Brand kit → Colors (name → role). */
export type ProposalDeckTheme = {
  bg: string
  fg: string
  muted: string
  accent: string
  line: string
  surface: string
  surfaceTint: string
  tagChipBg: string
  letterheadBg: string
  letterheadFg: string
  letterheadMuted: string
  letterheadLine: string
}

export const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/

/** Used only when brand kit has no colors — not shown in proposals once kit is configured. */
export const DECK_THEME_FALLBACK: ProposalDeckTheme = {
  bg: '#111111',
  fg: '#FAFAFA',
  muted: '#A3A3A3',
  accent: '#D99E6A',
  line: '#333333',
  surface: '#1A1A1A',
  surfaceTint: '#2A1F24',
  tagChipBg: '#2D1B24',
  letterheadBg: '#FFFFFF',
  letterheadFg: '#141414',
  letterheadMuted: '#575757',
  letterheadLine: '#E5E5E5',
}

/**
 * Brand kit color name → deck role.
 * Users label swatches in Studio → Brand → Colors (see i18n `brandKit.colorRolesHint`).
 */
const COLOR_ROLE_PATTERNS: Record<keyof ProposalDeckTheme, RegExp[]> = {
  accent: [
    /accent/i,
    /akzent/i,
    /primary/i,
    /brand/i,
    /highlight/i,
    /gold/i,
    /bronze/i,
    /burgundy/i,
    /^red$/i,
    /^rot$/i,
  ],
  bg: [/background/i, /^bg$/i, /deck/i, /dark/i, /hintergrund/i, /dark base/i, /\bbase\b/i],
  fg: [
    /heading/i,
    /^text$/i,
    /foreground/i,
    /^fg$/i,
    /title/i,
    /überschrift/i,
    /headline/i,
    /off.white/i,
    /off-white/i,
  ],
  muted: [/muted/i, /secondary/i, /body/i, /subtitle/i, /sekundär/i, /fließtext/i],
  line: [/line/i, /border/i, /divider/i, /linie/i],
  surface: [/surface/i, /card/i, /panel/i, /deep brown/i, /\bbrown\b/i],
  surfaceTint: [/tint/i, /plum/i, /wine/i, /wine dark/i],
  tagChipBg: [/tag/i, /chip/i, /service/i, /cta/i],
  letterheadBg: [/letterhead/i, /sheet/i, /paper/i, /light/i, /brief/i, /blatt/i, /^white$/i],
  letterheadFg: [/letterhead.?text/i, /sheet.?text/i, /brief.?text/i],
  letterheadMuted: [/letterhead.?muted/i, /sheet.?muted/i],
  letterheadLine: [/letterhead.?line/i, /sheet.?line/i],
}

export const DECK_COLOR_ROLE_LABELS: Record<keyof ProposalDeckTheme, string> = {
  accent: 'Accent',
  bg: 'Background',
  fg: 'Text / Heading',
  muted: 'Muted',
  line: 'Line',
  surface: 'Surface',
  surfaceTint: 'Surface tint',
  tagChipBg: 'Tag chip',
  letterheadBg: 'Letterhead',
  letterheadFg: 'Letterhead text',
  letterheadMuted: 'Letterhead muted',
  letterheadLine: 'Letterhead line',
}

/** Match a swatch name to a deck role (Brand kit → Colors). */
export function inferNamedColorRole(colorName: string): keyof ProposalDeckTheme | null {
  const name = colorName.trim()
  if (!name) return null
  for (const role of Object.keys(COLOR_ROLE_PATTERNS) as (keyof ProposalDeckTheme)[]) {
    if (COLOR_ROLE_PATTERNS[role].some((p) => p.test(name))) return role
  }
  return null
}

/** Which proposal role this swatch resolves to (name wins; else first swatch → accent). */
export function inferSwatchProposalRole(
  colors: StudioBrandColor[],
  index: number,
): keyof ProposalDeckTheme | null {
  const color = colors[index]
  if (!color) return null
  const named = inferNamedColorRole(color.name)
  if (named) return named
  if (index === 0 && colors.length > 0) return 'accent'
  return null
}

function normalizeHex(raw: string | undefined | null): string | null {
  const t = raw?.trim() ?? ''
  if (!HEX_COLOR.test(t)) return null
  return t.toUpperCase()
}

function pickColorByRole(
  colors: StudioBrandColor[],
  role: keyof ProposalDeckTheme,
  fallback: string,
): string {
  const patterns = COLOR_ROLE_PATTERNS[role]
  for (const c of colors) {
    const hex = normalizeHex(c.hex)
    if (!hex) continue
    const name = c.name.trim()
    if (!name) continue
    if (patterns.some((p) => p.test(name))) return hex
  }
  return fallback
}

/** Fill roles still on template fallback using palette luminance (no extra swatch names required). */
function fillMissingRolesFromPalette(
  theme: ProposalDeckTheme,
  colors: StudioBrandColor[],
  fallback: ProposalDeckTheme,
): ProposalDeckTheme {
  const hexes = colors
    .map((c) => normalizeHex(c.hex))
    .filter((h): h is string => Boolean(h))
  if (hexes.length === 0) return theme

  const isFallback = (key: keyof ProposalDeckTheme) => theme[key] === fallback[key]
  const sorted = [...hexes].sort((a, b) => hexRelativeLuminance(b) - hexRelativeLuminance(a))
  const lightest = sorted[0]
  const darkest = sorted[sorted.length - 1]
  const mid = sorted[Math.floor(sorted.length / 2)] ?? lightest
  const secondDarkest = sorted[sorted.length - 2] ?? darkest

  const next = { ...theme }

  const setIfFallback = (key: keyof ProposalDeckTheme, hex: string) => {
    if (isFallback(key)) next[key] = hex
  }

  setIfFallback('letterheadBg', lightest)
  setIfFallback('letterheadFg', darkest)
  setIfFallback('letterheadMuted', mid)
  setIfFallback('letterheadLine', mixHexColors(lightest, darkest, 0.14))
  setIfFallback('bg', darkest)
  setIfFallback('fg', lightest)
  setIfFallback('muted', mixHexColors(lightest, darkest, 0.45))
  setIfFallback('line', mixHexColors(darkest, lightest, 0.18))
  setIfFallback('surface', secondDarkest)
  setIfFallback('surfaceTint', secondDarkest)
  setIfFallback('tagChipBg', secondDarkest)

  return next
}

/** Which swatch hex resolved to each deck role (for Brand kit UI). */
export function resolveDeckThemeColorSources(
  brand: StudioBrandProfile | null,
): Partial<Record<keyof ProposalDeckTheme, string>> {
  if (!brand || brand.colors.length === 0) return {}
  const theme = resolveDeckThemeFromBrand(brand)
  const out: Partial<Record<keyof ProposalDeckTheme, string>> = {}
  for (const key of Object.keys(theme) as (keyof ProposalDeckTheme)[]) {
    out[key] = theme[key]
  }
  return out
}

/** Build full deck theme from primary brand kit colors (+ logo/fonts handled elsewhere). */
export function resolveDeckThemeFromBrand(brand: StudioBrandProfile | null): ProposalDeckTheme {
  if (!brand || brand.colors.length === 0) {
    return { ...DECK_THEME_FALLBACK }
  }

  const colors = brand.colors
  const firstHex = normalizeHex(colors[0]?.hex) ?? DECK_THEME_FALLBACK.accent

  const accent = pickColorByRole(colors, 'accent', firstHex)

  const named: ProposalDeckTheme = {
    accent,
    bg: pickColorByRole(colors, 'bg', DECK_THEME_FALLBACK.bg),
    fg: pickColorByRole(colors, 'fg', DECK_THEME_FALLBACK.fg),
    muted: pickColorByRole(colors, 'muted', DECK_THEME_FALLBACK.muted),
    line: pickColorByRole(colors, 'line', DECK_THEME_FALLBACK.line),
    surface: pickColorByRole(colors, 'surface', DECK_THEME_FALLBACK.surface),
    surfaceTint: pickColorByRole(colors, 'surfaceTint', DECK_THEME_FALLBACK.surfaceTint),
    tagChipBg: pickColorByRole(colors, 'tagChipBg', DECK_THEME_FALLBACK.tagChipBg),
    letterheadBg: pickColorByRole(colors, 'letterheadBg', DECK_THEME_FALLBACK.letterheadBg),
    letterheadFg: pickColorByRole(colors, 'letterheadFg', DECK_THEME_FALLBACK.letterheadFg),
    letterheadMuted: pickColorByRole(colors, 'letterheadMuted', DECK_THEME_FALLBACK.letterheadMuted),
    letterheadLine: pickColorByRole(colors, 'letterheadLine', DECK_THEME_FALLBACK.letterheadLine),
  }

  return fillMissingRolesFromPalette(named, colors, DECK_THEME_FALLBACK)
}

export type CoverThemeProps = {
  deckTheme?: ProposalDeckTheme | null
  deckAccentColor?: string | null
}

export function resolveDeckThemeFromCoverProps(props: CoverThemeProps): ProposalDeckTheme {
  const t = props.deckTheme
  if (t && normalizeHex(t.accent)) {
    return {
      ...DECK_THEME_FALLBACK,
      ...Object.fromEntries(
        (Object.keys(DECK_THEME_FALLBACK) as (keyof ProposalDeckTheme)[]).map((key) => [
          key,
          normalizeHex(t[key]) ?? DECK_THEME_FALLBACK[key],
        ]),
      ) as ProposalDeckTheme,
    }
  }

  const legacyAccent = normalizeHex(props.deckAccentColor)
  if (legacyAccent) {
    return { ...DECK_THEME_FALLBACK, accent: legacyAccent }
  }

  return { ...DECK_THEME_FALLBACK }
}

export function resolveDeckThemeFromBlocks(blocks: ProposalBlock[]): ProposalDeckTheme {
  const cover = blocks.find((b) => b.type === 'cover')
  if (cover?.type !== 'cover') return { ...DECK_THEME_FALLBACK }
  return resolveDeckThemeFromCoverProps(cover.props)
}

/** CSS custom properties for HTML preview (`ProposalDeckPreview`). */
export function deckThemeToCssVars(theme: ProposalDeckTheme): Record<string, string> {
  return {
    '--deck-bg': theme.bg,
    '--deck-fg': theme.fg,
    '--deck-muted': theme.muted,
    '--deck-accent': theme.accent,
    '--deck-line': theme.line,
    '--deck-surface': theme.surface,
    '--deck-surface-tint': theme.surfaceTint,
    '--deck-tag-chip-bg': theme.tagChipBg,
    '--deck-letterhead-bg': theme.letterheadBg,
    '--deck-letterhead-fg': theme.letterheadFg,
    '--deck-letterhead-muted': theme.letterheadMuted,
    '--deck-letterhead-line': theme.letterheadLine,
    '--deck-panel-plum': theme.surfaceTint,
    '--deck-case-card-bg': theme.surface,
  }
}

export function letterheadThemeToCssVars(theme: ProposalDeckTheme): Record<string, string> {
  return {
    '--deck-bg': theme.letterheadBg,
    '--deck-fg': theme.letterheadFg,
    '--deck-muted': theme.letterheadMuted,
    '--deck-accent': theme.accent,
    '--deck-line': theme.letterheadLine,
    '--deck-surface': theme.letterheadBg,
    '--deck-surface-tint': theme.letterheadLine,
    '--deck-tag-chip-bg': theme.tagChipBg,
    '--deck-letterhead-bg': theme.letterheadBg,
    '--deck-letterhead-fg': theme.letterheadFg,
    '--deck-letterhead-muted': theme.letterheadMuted,
    '--deck-letterhead-line': theme.letterheadLine,
    '--deck-panel-plum': theme.surfaceTint,
    '--deck-case-card-bg': theme.surface,
  }
}
