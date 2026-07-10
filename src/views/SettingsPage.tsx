'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Bell, Key, ChevronRight, Shield, Building2 } from 'lucide-react'
import { Container } from '@/components/atoms'
import { cn } from '@/lib/cn'
import { NotificationSettings } from '@/features/settings/NotificationSettings'
import { ApiKeysSettings } from '@/features/settings/ApiKeysSettings'
import { DataPrivacySettings } from '@/features/settings/DataPrivacySettings'
import { StudioSettingsContent } from '@/features/studio-settings/StudioSettingsContent'

const SETTINGS_NAV: { href: string; labelKey: string; icon: typeof Bell }[] = [
  { href: '/settings/studio', labelKey: 'settingsPage.studio', icon: Building2 },
  { href: '/settings/notifications', labelKey: 'settingsPage.notifications', icon: Bell },
  { href: '/settings/api-keys', labelKey: 'settingsPage.apiKeys', icon: Key },
  { href: '/settings/data', labelKey: 'settingsPage.dataPrivacy', icon: Shield },
]

function getActiveSection(pathname: string) {
  if (pathname.startsWith('/settings/studio')) return 'studio'
  if (pathname === '/settings/notifications') return 'notifications'
  if (pathname === '/settings/api-keys') return 'api-keys'
  if (pathname === '/settings/data') return 'data'
  // Bare `/settings` redirects to `/settings/studio` (see effect below).
  return 'studio'
}

export function SettingsPage() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const router = useRouter()
  const section = getActiveSection(pathname)
  const sectionNav = SETTINGS_NAV.find((n) => getActiveSection(n.href) === section)
  const sectionLabel = sectionNav ? t(sectionNav.labelKey) : ''

  // Bare `/settings` is no longer a real section (Team moved into Studio) —
  // bounce to the Studio shell which is the canonical Workspace Settings hub.
  useEffect(() => {
    if (pathname === '/settings') router.replace('/settings/studio')
  }, [pathname, router])

  return (
    <Container
      className={cn(
        section === 'studio'
          ? 'flex min-h-0 w-full max-w-none flex-1 flex-col px-0 py-0'
          : 'py-8',
      )}
    >
      {section !== 'studio' ? (
        <>
          <h1 className="text-2xl font-semibold">{t('settingsPage.title')}</h1>
          <p className="crm-prose-width mt-1 text-sm text-pretty text-muted">{t('settingsPage.subtitle')}</p>

          <div className="mt-2">
            <div className="flex items-center gap-1 text-xs text-muted">
              <Link href="/settings" className="hover:text-foreground">
                {t('common.settings')}
              </Link>
              <ChevronRight size={12} className="shrink-0" aria-hidden />
              <span className="text-foreground">{sectionLabel}</span>
            </div>
          </div>
        </>
      ) : null}

      {section === 'studio' ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <StudioSettingsContent />
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-8 lg:flex-row">
          <nav className="sticky top-4 z-10 shrink-0 self-start bg-background lg:w-48">
            <ul className="flex gap-1 overflow-x-auto lg:flex-col">
              {SETTINGS_NAV.map((item) => {
                const active =
                  item.href === '/settings/studio'
                    ? pathname.startsWith('/settings/studio')
                    : pathname.startsWith(item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2 whitespace-nowrap rounded-sm px-3 py-2 text-sm transition-colors',
                        active
                          ? 'bg-active font-medium text-foreground'
                          : 'text-muted hover:bg-hover hover:text-foreground',
                      )}
                    >
                      <item.icon size={16} />
                      {t(item.labelKey)}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="crm-prose-width min-w-0 flex-1">
            {section === 'notifications' && <NotificationSettings />}
            {section === 'api-keys' && <ApiKeysSettings />}
            {section === 'data' && <DataPrivacySettings />}
          </div>
        </div>
      )}
    </Container>
  )
}
