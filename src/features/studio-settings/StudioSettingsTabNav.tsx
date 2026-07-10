'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import {
  Building2,
  CreditCard,
  FileText,
  HandCoins,
  Palette,
  Receipt,
  Sparkles,
  Store,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import {
  studioSettingsInnerTop,
  studioSettingsNavColumn,
  studioSettingsNavGutter,
  studioSettingsNavItem,
  studioSettingsNavLink,
  studioSettingsNavList,
  studioSideNavItem,
} from '@/features/studio-settings/studioBlockChrome'

type StudioTab =
  | {
      kind: 'link'
      href: string
      labelKey: string
      icon: LucideIcon
      match: (p: string) => boolean
    }
  | { kind: 'placeholder'; id: string; labelKey: string; icon: LucideIcon }

const STUDIO_TABS: StudioTab[] = [
  {
    kind: 'link',
    href: '/settings/studio',
    labelKey: 'studioSettings.tabs.general',
    icon: Building2,
    match: (p) => p === '/settings/studio',
  },
  {
    kind: 'link',
    href: '/settings/studio/brand/general',
    labelKey: 'studioSettings.tabs.brand',
    icon: Palette,
    match: (p) => p.startsWith('/settings/studio/brand'),
  },
  {
    kind: 'link',
    href: '/settings/studio/sales/groups',
    labelKey: 'studioSettings.tabs.sales',
    icon: Store,
    match: (p) => p.startsWith('/settings/studio/sales'),
  },
  {
    kind: 'link',
    href: '/settings/studio/proposal',
    labelKey: 'studioSettings.tabs.proposal',
    icon: FileText,
    match: (p) => p.startsWith('/settings/studio/proposal'),
  },
  {
    kind: 'link',
    href: '/settings/studio/invoicing',
    labelKey: 'studioSettings.tabs.invoicing',
    icon: Receipt,
    match: (p) => p.startsWith('/settings/studio/invoicing'),
  },
  {
    kind: 'link',
    href: '/settings/studio/offer',
    labelKey: 'studioSettings.tabs.offer',
    icon: HandCoins,
    match: (p) => p.startsWith('/settings/studio/offer'),
  },
  {
    kind: 'link',
    href: '/settings/studio/team',
    labelKey: 'studioSettings.tabs.team',
    icon: Users,
    match: (p) => p.startsWith('/settings/studio/team'),
  },
  { kind: 'placeholder', id: 'billing', labelKey: 'studioSettings.tabs.billing', icon: CreditCard },
  { kind: 'placeholder', id: 'ai', labelKey: 'studioSettings.tabs.ai', icon: Sparkles },
]

export function StudioSettingsTabNav({ compactShell = false }: { compactShell?: boolean }) {
  const { t } = useTranslation()
  const pathname = usePathname()

  return (
    <nav
      aria-label={t('studioSettings.navAria')}
      className={cn(
        studioSettingsNavColumn,
        compactShell
          ? 'border-b border-border lg:overflow-y-auto lg:overscroll-contain lg:border-b-0 lg:border-r'
          : 'mb-6 lg:mb-0 lg:w-80',
      )}
    >
      <ul
        className={cn(
          studioSettingsNavList,
          studioSettingsNavGutter,
          studioSettingsInnerTop,
          compactShell ? 'lg:pb-0' : undefined,
        )}
      >
        {STUDIO_TABS.map((tab) => {
          if (tab.kind === 'placeholder') {
            return (
              <li key={tab.id} className={studioSettingsNavItem}>
                <span
                  className={cn(
                    studioSideNavItem,
                    studioSettingsNavLink,
                    'cursor-not-allowed text-muted opacity-70',
                  )}
                  title={t('studioSettings.tabs.placeholderHint')}
                  aria-disabled="true"
                >
                  <tab.icon size={16} aria-hidden />
                  {t(tab.labelKey)}
                </span>
              </li>
            )
          }
          const active = tab.match(pathname)
          return (
            <li key={tab.href} className={studioSettingsNavItem}>
              <Link
                href={tab.href}
                className={cn(
                  studioSideNavItem,
                  studioSettingsNavLink,
                  active
                    ? 'bg-active font-medium text-foreground'
                    : 'text-muted hover:bg-hover hover:text-foreground',
                )}
              >
                <tab.icon size={16} aria-hidden />
                {t(tab.labelKey)}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
