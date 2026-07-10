import { StyleSheet } from '@react-pdf/renderer'
import {
  DECK_PAGE_MARGIN_PT,
  DECK_TYPE_SCALE,
  VISUAL_GRID_ROW_HEIGHT_PT,
} from '@/lib/proposals/deckLayout'
import type { ProposalDeckTheme } from '@/lib/proposals/deckTheme'

export type PdfSectionColors = {
  fg: string
  muted: string
  line: string
  bg: string
  accent: string
  surface: string
  surfaceTint: string
  tagChipBg: string
}

export function pdfSectionColors(theme: ProposalDeckTheme, letterhead: boolean): PdfSectionColors {
  if (letterhead) {
    return {
      fg: theme.letterheadFg,
      muted: theme.letterheadMuted,
      line: theme.letterheadLine,
      bg: theme.letterheadBg,
      accent: theme.accent,
      surface: theme.letterheadBg,
      surfaceTint: theme.letterheadLine,
      tagChipBg: theme.tagChipBg,
    }
  }
  return {
    fg: theme.fg,
    muted: theme.muted,
    line: theme.line,
    bg: theme.bg,
    accent: theme.accent,
    surface: theme.surface,
    surfaceTint: theme.surfaceTint,
    tagChipBg: theme.tagChipBg,
  }
}

export function buildPdfStyles(theme: ProposalDeckTheme) {
  return StyleSheet.create({
    page: {
      padding: DECK_PAGE_MARGIN_PT,
      fontFamily: 'Helvetica',
      fontSize: DECK_TYPE_SCALE.body,
      color: theme.fg,
      backgroundColor: theme.bg,
    },
    coverHeadline: {
      fontSize: DECK_TYPE_SCALE.coverTitle,
      marginBottom: 12,
      color: theme.fg,
      textTransform: 'uppercase',
      letterSpacing: 1.6,
    },
    coverSubtitle: {
      fontSize: DECK_TYPE_SCALE.coverSubtitle,
      color: theme.muted,
      marginBottom: 24,
    },
    h2: {
      fontSize: DECK_TYPE_SCALE.h1,
      marginBottom: 10,
      marginTop: 8,
      color: theme.fg,
    },
    body: {
      fontSize: DECK_TYPE_SCALE.body,
      lineHeight: 1.45,
      marginBottom: 6,
      color: theme.muted,
    },
    rule: {
      borderBottomWidth: 1,
      borderBottomColor: theme.line,
      marginBottom: 16,
      paddingBottom: 16,
    },
    small: {
      fontSize: DECK_TYPE_SCALE.small,
      color: theme.muted,
    },
    meta: {
      fontSize: DECK_TYPE_SCALE.caption,
      color: theme.muted,
      marginBottom: 24,
    },
    pageLight: {
      padding: DECK_PAGE_MARGIN_PT,
      fontFamily: 'Helvetica',
      fontSize: DECK_TYPE_SCALE.body,
      color: theme.letterheadFg,
      backgroundColor: theme.letterheadBg,
    },
    metaLight: {
      fontSize: DECK_TYPE_SCALE.caption,
      color: theme.letterheadMuted,
      marginBottom: 24,
    },
    letterheadFooter: {
      position: 'absolute',
      bottom: 28,
      left: DECK_PAGE_MARGIN_PT,
      right: DECK_PAGE_MARGIN_PT,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    footerBrand: {
      fontSize: DECK_TYPE_SCALE.caption,
      color: theme.letterheadMuted,
    },
    footerPage: {
      fontSize: DECK_TYPE_SCALE.caption,
      color: theme.letterheadMuted,
    },
    kpiCol: {
      width: '30%',
    },
    kpiVal: {
      fontSize: DECK_TYPE_SCALE.h2,
      marginBottom: 4,
      color: theme.accent,
    },
    accentLabel: {
      fontSize: DECK_TYPE_SCALE.small,
      color: theme.accent,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
    },
    tableHeader: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: theme.line,
      paddingBottom: 6,
      marginBottom: 6,
    },
    tableRow: {
      flexDirection: 'row',
      marginBottom: 6,
    },
    cell: {
      fontSize: DECK_TYPE_SCALE.small,
      color: theme.muted,
      paddingRight: 8,
    },
    vgRow: {
      flexDirection: 'row',
      marginBottom: 12,
      alignItems: 'stretch',
      gap: 6,
    },
    vgTextBreak: {
      wordBreak: 'break-all',
    },
    vgRowHeight: {
      minHeight: VISUAL_GRID_ROW_HEIGHT_PT,
      height: VISUAL_GRID_ROW_HEIGHT_PT,
    },
  })
}

export type ProposalPdfStyles = ReturnType<typeof buildPdfStyles>
