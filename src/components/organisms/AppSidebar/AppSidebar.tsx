'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, Settings, PanelLeftClose, PanelRightOpen, Users, Briefcase, Calendar, FileText } from 'lucide-react'
import { cn } from '@/lib/cn'
import { IconButton } from '@/components/atoms'
import { useUserStore } from '@/stores/userStore'

interface NavItem {
  href: string
  icon: typeof LayoutDashboard
  labelKey: string
  match: (path: string) => boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/',
    icon: LayoutDashboard,
    labelKey: 'tabs.dashboard',
    match: (p) => p === '/',
  },
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
  {
    href: '/proposals',
    icon: FileText,
    labelKey: 'tabs.proposals',
    match: (p) => p.startsWith('/proposals'),
  },
  {
    href: '/offers',
    icon: Briefcase,
    labelKey: 'tabs.offers',
    match: (p) => p.startsWith('/offers'),
  },
  {
    href: '/settings',
    icon: Settings,
    labelKey: 'common.settings',
    match: (p) => p.startsWith('/settings'),
  },
]

export function AppSidebar() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const collapsed = useUserStore((s) => s.sidebarCollapsed)
  const setCollapsed = useUserStore((s) => s.setSidebarCollapsed)

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col border-r border-border bg-background transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-56',
      )}
    >
      <div className={cn('flex h-14 items-center border-b border-border', collapsed ? 'justify-center px-2' : 'px-4')}>
        {!collapsed && (
          <Link href="/" className="text-sm font-semibold tracking-tight">
            2mb CRM
          </Link>
        )}
        <div className={cn(collapsed ? '' : 'ml-auto')}>
          <IconButton
            icon={collapsed ? PanelRightOpen : PanelLeftClose}
            label={collapsed ? t('nav.expand') : t('nav.collapse')}
            onClick={() => setCollapsed(!collapsed)}
          />
        </div>
      </div>

      <nav className="flex-1 py-2">
        <ul className="space-y-0.5 px-2">
          {NAV_ITEMS.map((item) => {
            const active = item.match(pathname)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-active font-medium text-foreground'
                      : 'text-muted hover:bg-hover hover:text-foreground',
                    collapsed && 'justify-center px-0',
                  )}
                >
                  <item.icon size={18} />
                  {!collapsed && <span>{t(item.labelKey)}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
