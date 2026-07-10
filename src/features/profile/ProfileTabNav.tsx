'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Monitor, Shield, ShieldCheck, User, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'
import {
  studioSettingsInnerTop,
  studioSettingsListHeader,
  studioSettingsNavColumn,
  studioSettingsNavGutter,
  studioSettingsNavItem,
  studioSettingsNavLink,
  studioSettingsNavList,
  studioSideNavItem,
} from '@/features/studio-settings/studioBlockChrome'
import {
  PROFILE_BASE,
  PROFILE_DATA,
  PROFILE_ME,
  PROFILE_SECURITY,
  PROFILE_SESSIONS,
} from '@/lib/profile/profilePaths'

type ProfileNavLink = {
  href: string
  labelKey: string
  icon: LucideIcon
  match: (p: string) => boolean
}

const PROFILE_TABS: ProfileNavLink[] = [
  {
    href: PROFILE_ME,
    labelKey: 'profile.myProfile',
    icon: User,
    match: (p) => p === PROFILE_BASE || p === PROFILE_ME,
  },
  {
    href: PROFILE_SECURITY,
    labelKey: 'profile.security',
    icon: Shield,
    match: (p) => p === PROFILE_SECURITY,
  },
  {
    href: PROFILE_SESSIONS,
    labelKey: 'profile.sessions',
    icon: Monitor,
    match: (p) => p === PROFILE_SESSIONS,
  },
  {
    href: PROFILE_DATA,
    labelKey: 'settingsPage.dataPrivacy',
    icon: ShieldCheck,
    match: (p) => p === PROFILE_DATA,
  },
]

export function ProfileTabNav({ compactShell = true }: { compactShell?: boolean }) {
  const { t } = useTranslation()
  const pathname = usePathname()

  return (
    <nav
      aria-label={t('profile.navAria')}
      className={cn(
  studioSettingsListHeader,
  studioSettingsNavColumn,
        compactShell
          ? 'shrink-0 border-b border-border lg:overflow-y-auto lg:overscroll-contain lg:border-b-0 lg:border-r'
          : 'mb-6 lg:mb-0 lg:w-80',
      )}
    >
      <ul
        className={cn(
          studioSettingsNavList,
          studioSettingsNavGutter,
          studioSettingsInnerTop,
          compactShell ? 'pb-2 lg:pb-0' : undefined,
        )}
      >
        {PROFILE_TABS.map((tab) => {
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
                aria-current={active ? 'page' : undefined}
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
