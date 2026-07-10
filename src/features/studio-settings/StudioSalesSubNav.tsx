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
  STUDIO_SALES_GROUPS,
  STUDIO_SALES_PRODUCTS,
  STUDIO_SALES_REVIEWS,
  STUDIO_SALES_SEGMENTS,
  STUDIO_SALES_SERVICES,
  STUDIO_SALES_TOOLS,
  STUDIO_SALES_WORKS,
  STUDIO_SALES_PLAYBOOKS,
  isStudioSalesListPath,
  isStudioSalesPath,
} from '@/lib/studio/studioSalesPaths'

const SALES_TABS: { href: string; labelKey: string; match: (p: string) => boolean }[] = [
  { href: STUDIO_SALES_GROUPS, labelKey: 'studioSettings.sales.tabs.groups', match: (p) => p.startsWith(STUDIO_SALES_GROUPS) },
  {
    href: STUDIO_SALES_SERVICES,
    labelKey: 'studioSettings.sales.tabs.services',
    match: (p) => p.startsWith(STUDIO_SALES_SERVICES),
  },
  {
    href: STUDIO_SALES_PRODUCTS,
    labelKey: 'studioSettings.sales.tabs.products',
    match: (p) => p.startsWith(STUDIO_SALES_PRODUCTS),
  },
  {
    href: STUDIO_SALES_SEGMENTS,
    labelKey: 'studioSettings.sales.tabs.segments',
    match: (p) => p.startsWith(STUDIO_SALES_SEGMENTS),
  },
  {
    href: STUDIO_SALES_WORKS,
    labelKey: 'studioSettings.sales.tabs.works',
    match: (p) => p.startsWith(STUDIO_SALES_WORKS),
  },
  {
    href: STUDIO_SALES_TOOLS,
    labelKey: 'studioSettings.sales.tabs.tools',
    match: (p) => p.startsWith(STUDIO_SALES_TOOLS),
  },
  { href: STUDIO_SALES_REVIEWS, labelKey: 'studioSettings.sales.tabs.reviews', match: (p) => p.startsWith(STUDIO_SALES_REVIEWS) },
  {
    href: STUDIO_SALES_PLAYBOOKS,
    labelKey: 'studioSettings.sales.tabs.playbooks',
    match: (p) => p.startsWith(STUDIO_SALES_PLAYBOOKS),
  },
]

export function StudioSalesSubNav() {
  const { t } = useTranslation()
  const pathname = usePathname()
  if (!isStudioSalesPath(pathname) || !isStudioSalesListPath(pathname)) return null

  return (
    <div>
      <nav
        aria-label={t('studioSettings.sales.subNavAria')}
        className={cn(tabNavShellStaticClass, 'min-w-0 max-w-full')}
      >
        <ul className={tabListSectionNavClass}>
          {SALES_TABS.map((tab) => {
            const active = tab.match(pathname)
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
