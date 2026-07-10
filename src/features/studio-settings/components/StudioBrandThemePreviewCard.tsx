'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Palette } from 'lucide-react'
import { studioTintPanel } from '@/features/studio-settings/studioBlockChrome'
import {
  getPrimaryBrandKit,
  resolveBrandTheme,
} from '@/features/studio-settings/lib/studioBrandTheme'
import { brandKitDisplayName } from '@/features/studio-settings/lib/studioBrandKitHelpers'
import { cn } from '@/lib/cn'
import { useStudioProfileStore } from '@/stores/studioProfileStore'

type StudioBrandThemePreviewCardProps = {
  className?: string
  /** Shown under the card title — e.g. proposal / offer / invoice context. */
  contextHintKey?: string
}

export function StudioBrandThemePreviewCard({
  className,
  contextHintKey = 'studioSettings.brandKit.documentThemeHint',
}: StudioBrandThemePreviewCardProps) {
  const { t } = useTranslation()
  const general = useStudioProfileStore((s) => s.general)
  const kit = getPrimaryBrandKit(general)
  const theme = kit ? resolveBrandTheme(kit) : null
  const untitled = t('studioSettings.brandKit.untitledKit')

  return (
    <div className={cn(studioTintPanel, 'space-y-3 p-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <Palette size={18} className="mt-0.5 shrink-0 text-muted" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{t('studioSettings.brandKit.documentThemeTitle')}</p>
            <p className="text-xs text-muted">{t(contextHintKey)}</p>
          </div>
        </div>
        <Link
          href="/settings/studio/brand"
          className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-foreground underline-offset-2 hover:underline"
        >
          {t('studioSettings.brandKit.openBrandKit')}
          <ChevronRight size={14} aria-hidden />
        </Link>
      </div>

      {theme ? (
        <div className="flex flex-wrap items-center gap-3">
          {theme.primaryLogoUrl ? (
            <img
              src={theme.primaryLogoUrl}
              alt=""
              className="h-10 max-w-[8rem] object-contain"
            />
          ) : (
            <span className="text-xs text-muted">{t('studioSettings.brandKit.noPrimaryLogo')}</span>
          )}
          <div className="flex items-center gap-1.5">
            {theme.colors.slice(0, 5).map((c) => (
              <span
                key={c.id}
                className="h-6 w-6 shrink-0 border border-border"
                style={{ backgroundColor: c.hex }}
                title={c.name || c.hex}
              />
            ))}
          </div>
          <div className="min-w-0 text-xs text-muted">
            <p className="truncate">
              {brandKitDisplayName(kit!, untitled)}
              {' · '}
              {t('studioSettings.brandKit.accentFontLabel')}:{' '}
              <span style={{ fontFamily: theme.accentFontFamily }}>{theme.accentFont?.family ?? '—'}</span>
            </p>
            <p className="truncate">
              {t('studioSettings.brandKit.bodyFontLabel')}:{' '}
              <span style={{ fontFamily: theme.bodyFontFamily }}>{theme.bodyFont?.family ?? '—'}</span>
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">{t('studioSettings.brandKit.emptyState')}</p>
      )}
    </div>
  )
}

export function StudioBrandKitLinkCard() {
  const { t } = useTranslation()
  const general = useStudioProfileStore((s) => s.general)
  const kit = getPrimaryBrandKit(general)
  const theme = kit ? resolveBrandTheme(kit) : null

  return (
    <Link
      href="/settings/studio/brand"
      className={cn(
        studioTintPanel,
        'flex items-center justify-between gap-3 p-4 transition-colors hover:bg-hover',
      )}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium text-foreground">{t('studioSettings.brandKit.manageVisualIdentity')}</p>
        <p className="text-xs text-muted">{t('studioSettings.brandKit.manageVisualIdentityHint')}</p>
        {theme ? (
          <p className="text-xs text-muted">
            {t('studioSettings.brandKit.kitSummary', {
              logos: kit!.logos.filter((l) => l.imageDataUrl).length,
              fonts: kit!.fonts.length,
              colors: kit!.colors.length,
            })}
          </p>
        ) : null}
      </div>
      <ChevronRight size={18} className="shrink-0 text-muted" aria-hidden />
    </Link>
  )
}
