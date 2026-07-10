'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import {
  tabListSectionNavClass,
  tabNavShellStaticClass,
  tabTriggerSectionClass,
} from '@/components/molecules/Tabs/tabListStyles'
import {
  STUDIO_BRAND_BASE,
  STUDIO_BRAND_BUSINESS,
  STUDIO_BRAND_COLORS,
  STUDIO_BRAND_FONTS,
  STUDIO_BRAND_GENERAL,
  STUDIO_BRAND_LOGOS,
  STUDIO_BRAND_NETWORKS,
  STUDIO_BRAND_STRATEGY,
  STUDIO_BRAND_VOICE,
  isStudioBrandPath,
} from '@/lib/studio/studioBrandPaths'

const BRAND_TABS: { href: string; labelKey: string }[] = [
  { href: STUDIO_BRAND_GENERAL, labelKey: 'studioSettings.brand.tabs.general' },
  { href: STUDIO_BRAND_LOGOS, labelKey: 'studioSettings.brand.tabs.logos' },
  { href: STUDIO_BRAND_COLORS, labelKey: 'studioSettings.brand.tabs.colors' },
  { href: STUDIO_BRAND_FONTS, labelKey: 'studioSettings.brand.tabs.fonts' },
  { href: STUDIO_BRAND_NETWORKS, labelKey: 'studioSettings.brand.tabs.networks' },
  { href: STUDIO_BRAND_VOICE, labelKey: 'studioSettings.brand.tabs.voice' },
  { href: STUDIO_BRAND_STRATEGY, labelKey: 'studioSettings.brand.tabs.strategy' },
  { href: STUDIO_BRAND_BUSINESS, labelKey: 'studioSettings.brand.tabs.business' },
]

export function StudioBrandSubNav() {
  const { t } = useTranslation()
  const pathname = usePathname()
  if (!isStudioBrandPath(pathname)) return null

  return (
    <div>
      <nav
        aria-label={t('studioSettings.brand.subNavAria')}
        className={cn(tabNavShellStaticClass, 'min-w-0 max-w-full')}
      >
        <ul className={tabListSectionNavClass}>
          {BRAND_TABS.map((tab) => {
            // /settings/studio/brand (bare) implicitly maps to "general", so
            // highlight the General tab when the user lands on the base path.
            const active =
              pathname === tab.href ||
              (tab.href === STUDIO_BRAND_GENERAL && pathname === STUDIO_BRAND_BASE)
            return (
              <li key={tab.href} className="shrink-0">
                <Link
                  href={tab.href}
                  className={cn(
                    tabTriggerSectionClass,
                    'inline-flex shrink-0 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-ring',
                    active && 'border-primary text-foreground',
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  {t(tab.labelKey)}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
