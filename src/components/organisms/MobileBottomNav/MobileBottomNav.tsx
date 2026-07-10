'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogBackdrop, DialogPanel, Portal } from '@headlessui/react'
import {
  Briefcase,
  Calendar,
  ChevronRight,
  Ellipsis,
  FileText,
  LayoutDashboard,
  Settings,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import { IconButton } from '@/components/atoms'
import { cn } from '@/lib/cn'

type NavItem = {
  href: string
  icon: LucideIcon
  labelKey: string
  match: (pathname: string) => boolean
}

const PRIMARY_NAV_ITEMS: readonly NavItem[] = [
  { href: '/', icon: LayoutDashboard, labelKey: 'tabs.dashboard', match: (p) => p === '/' },
  {
    href: '/prospects',
    icon: Users,
    labelKey: 'tabs.prospects',
    match: (p) => p.startsWith('/prospects'),
  },
  {
    href: '/calendar',
    icon: Calendar,
    labelKey: 'tabs.calendar',
    match: (p) => p.startsWith('/calendar'),
  },
] as const

const MORE_NAV_ITEMS: readonly NavItem[] = [
  {
    href: '/proposals',
    icon: FileText,
    labelKey: 'tabs.proposals',
    match: (p) => p.startsWith('/proposals'),
  },
  { href: '/offers', icon: Briefcase, labelKey: 'tabs.offers', match: (p) => p.startsWith('/offers') },
  {
    href: '/settings',
    icon: Settings,
    labelKey: 'common.settings',
    match: (p) => p.startsWith('/settings'),
  },
] as const

function navItemActiveClass(active: boolean) {
  return cn(
    'relative flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[10px] font-medium leading-tight transition-colors',
    active ? 'text-foreground' : 'text-muted',
  )
}

function NavTab({
  href,
  icon: Icon,
  label,
  active,
  onClick,
  ariaExpanded,
}: {
  href?: string
  icon: LucideIcon
  label: string
  active: boolean
  onClick?: () => void
  ariaExpanded?: boolean
}) {
  const inner = (
    <>
      {active ? (
        <span
          className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-foreground"
          aria-hidden
        />
      ) : null}
      <Icon size={20} strokeWidth={active ? 2 : 1.5} aria-hidden />
      <span className="max-w-full truncate">{label}</span>
    </>
  )

  const className = navItemActiveClass(active)

  if (href) {
    return (
      <Link href={href} className={className} aria-current={active ? 'page' : undefined}>
        {inner}
      </Link>
    )
  }

  return (
    <button
      type="button"
      className={className}
      aria-expanded={ariaExpanded}
      aria-haspopup="dialog"
      onClick={onClick}
    >
      {inner}
    </button>
  )
}

export function MobileBottomNav() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  const moreActive = useMemo(
    () => MORE_NAV_ITEMS.some((item) => item.match(pathname)),
    [pathname],
  )

  const activeMoreItem = useMemo(
    () => MORE_NAV_ITEMS.find((item) => item.match(pathname)),
    [pathname],
  )

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background pb-[env(safe-area-inset-bottom,0px)] lg:hidden"
        aria-label={t('mobileNav.aria')}
      >
        <div className="flex items-stretch">
          {PRIMARY_NAV_ITEMS.map((item) => (
            <NavTab
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={t(item.labelKey)}
              active={item.match(pathname)}
            />
          ))}
          <NavTab
            icon={Ellipsis}
            label={moreActive && activeMoreItem ? t(activeMoreItem.labelKey) : t('tabs.more')}
            active={moreActive}
            ariaExpanded={moreOpen}
            onClick={() => setMoreOpen(true)}
          />
        </div>
      </nav>

      <Portal>
        <Dialog open={moreOpen} onClose={() => setMoreOpen(false)} className="relative z-50 lg:hidden">
          <DialogBackdrop className="fixed inset-0 bg-[color:var(--ui-scrim)] transition-opacity" />

          <div className="fixed inset-x-0 bottom-0 pb-[env(safe-area-inset-bottom,0px)]">
            <DialogPanel className="mx-auto w-full max-w-lg rounded-t-lg border border-b-0 border-border bg-background shadow-lg">
              <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{t('mobileNav.moreTitle')}</p>
                  <p className="mt-0.5 text-xs text-muted">{t('mobileNav.moreHint')}</p>
                </div>
                <IconButton
                  icon={X}
                  size="sm"
                  variant="ghost"
                  label={t('common.close')}
                  onClick={() => setMoreOpen(false)}
                />
              </div>
              <ul className="py-1">
                {MORE_NAV_ITEMS.map((item) => {
                  const active = item.match(pathname)
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                        className={cn(
                          'flex min-h-[52px] items-center gap-3 px-4 py-3 text-sm transition-colors',
                          active
                            ? 'bg-active font-medium text-foreground'
                            : 'text-foreground hover:bg-hover',
                        )}
                        aria-current={active ? 'page' : undefined}
                      >
                        <item.icon size={20} strokeWidth={1.5} className="shrink-0 text-muted" />
                        <span className="min-w-0 flex-1">{t(item.labelKey)}</span>
                        <ChevronRight size={16} className="shrink-0 text-muted" aria-hidden />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </DialogPanel>
          </div>
        </Dialog>
      </Portal>
    </>
  )
}
