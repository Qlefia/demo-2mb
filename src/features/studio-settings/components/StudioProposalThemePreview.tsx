'use client'

import { useTranslation } from 'react-i18next'
import {
  DECK_COLOR_ROLE_LABELS,
  deckThemeToCssVars,
  resolveDeckThemeFromBrand,
  type ProposalDeckTheme,
} from '@/lib/proposals/deckTheme'
import { studioTintPanel } from '@/features/studio-settings/studioBlockChrome'
import { cn } from '@/lib/cn'
import type { StudioBrandProfile } from '@/stores/studioProfileTypes'

const PREVIEW_ROLES: (keyof ProposalDeckTheme)[] = [
  'accent',
  'bg',
  'fg',
  'muted',
  'line',
  'surface',
  'letterheadBg',
  'letterheadFg',
  'letterheadMuted',
  'letterheadLine',
]

function MiniDeckStrip({
  label,
  bg,
  fg,
  accent,
  muted,
}: {
  label: string
  bg: string
  fg: string
  accent: string
  muted: string
}) {
  return (
    <div className="min-w-0 flex-1">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <div
        className="overflow-hidden rounded-lg border border-border"
        style={{ backgroundColor: bg, color: fg }}
      >
        <div className="flex items-center justify-between gap-2 border-b px-2.5 py-2" style={{ borderColor: muted }}>
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: accent }}>
            Paket
          </span>
          <span className="h-2 w-8 rounded-full" style={{ backgroundColor: accent }} aria-hidden />
        </div>
        <p className="px-2.5 py-2 text-[11px] leading-snug" style={{ color: muted }}>
          Body · milestone
        </p>
      </div>
    </div>
  )
}

export function StudioProposalThemePreview({ brand }: { brand: StudioBrandProfile }) {
  const { t } = useTranslation()
  const theme = resolveDeckThemeFromBrand(brand)

  return (
    <div className={cn(studioTintPanel, 'space-y-3 p-3')}>
      <p className="text-xs font-medium text-foreground">
        {t('studioSettings.brandKit.proposalPreviewTitle')}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <MiniDeckStrip
          label={t('studioSettings.brandKit.proposalPreviewDarkDeck')}
          bg={theme.bg}
          fg={theme.fg}
          accent={theme.accent}
          muted={theme.muted}
        />
        <MiniDeckStrip
          label={t('studioSettings.brandKit.proposalPreviewLetterhead')}
          bg={theme.letterheadBg}
          fg={theme.letterheadFg}
          accent={theme.accent}
          muted={theme.letterheadMuted}
        />
      </div>
      <ul className="grid gap-1 sm:grid-cols-2">
        {PREVIEW_ROLES.map((role) => (
          <li key={role} className="flex items-center gap-2 text-[11px]">
            <span
              className="h-4 w-4 shrink-0 border border-border"
              style={{ backgroundColor: theme[role] }}
              aria-hidden
            />
            <span className="min-w-0 truncate text-muted">
              {DECK_COLOR_ROLE_LABELS[role]}
              <span className="font-mono text-foreground"> · {theme[role]}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="text-[10px] leading-relaxed text-muted">{t('studioSettings.brandKit.proposalPreviewHint')}</p>
    </div>
  )
}

/** Expose resolved CSS vars for debugging / Storybook. */
export function proposalThemeCssVarsForBrand(brand: StudioBrandProfile): Record<string, string> {
  return deckThemeToCssVars(resolveDeckThemeFromBrand(brand))
}
