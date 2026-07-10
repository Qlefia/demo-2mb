'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'

const TABS = [
  { href: '/', labelKey: 'tabs.dashboard', match: (p: string) => p === '/' },
  { href: '/prospects', labelKey: 'tabs.prospects', match: (p: string) => p.startsWith('/prospects') },
  { href: '/calendar', labelKey: 'tabs.calendar', match: (p: string) => p.startsWith('/calendar') },
  { href: '/proposals', labelKey: 'tabs.proposals', match: (p: string) => p.startsWith('/proposals') },
  { href: '/offers', labelKey: 'tabs.offers', match: (p: string) => p.startsWith('/offers') },
] as const

export function TopNavTabs() {
  const { t } = useTranslation()
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1">
      {TABS.map((tab) => {
        const active = tab.match(pathname)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'rounded-sm px-3 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'bg-active text-foreground'
                : 'text-muted hover:bg-hover hover:text-foreground',
            )}
          >
            {t(tab.labelKey)}
          </Link>
        )
      })}
    </nav>
  )
}
