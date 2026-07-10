'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Menu } from 'lucide-react'
import { IconButton } from '@/components/atoms'
import { Breadcrumb } from '@/components/molecules'
import { cn } from '@/lib/cn'
import { PAGE_FRAME_CLASS } from '@/lib/layout/pageFrame'

const NotificationBell = dynamic(
  () => import('@/components/molecules/NotificationBell/NotificationBell').then((m) => m.NotificationBell),
  { ssr: false },
)

const UserMenu = dynamic(
  () => import('@/components/molecules/UserMenu/UserMenu').then((m) => m.UserMenu),
  { ssr: false },
)

interface AppHeaderProps {
  breadcrumbs?: { label: string; href?: string }[]
  onMobileMenuToggle?: () => void
}

export function AppHeader({ breadcrumbs, onMobileMenuToggle }: AppHeaderProps) {
  const { t } = useTranslation()

  const defaultBreadcrumbs = breadcrumbs ?? [
    { label: t('tabs.dashboard'), href: '/' },
  ]

  return (
    <header className="shrink-0 border-b border-border">
      <div
        className={cn(
          PAGE_FRAME_CLASS,
          'flex h-14 items-center justify-between gap-4',
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="lg:hidden">
            <IconButton
              icon={Menu}
              label={t('nav.menu')}
              onClick={onMobileMenuToggle}
            />
          </div>
          <Link href="/" className="text-sm font-semibold tracking-tight lg:hidden">
            2mb CRM
          </Link>
          <div className="hidden lg:block">
            <Breadcrumb items={defaultBreadcrumbs} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
