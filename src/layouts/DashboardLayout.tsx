'use client'

import dynamic from 'next/dynamic'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { IconButton, PageLoadingCenter } from '@/components/atoms'
import { AppBrandMarkLink } from '@/components/brand/AppBrandMarkLink'
import { PAGE_FRAME_CLASS, DASHBOARD_HEADER_BAR_CLASS } from '@/lib/layout/pageFrame'
import { cn } from '@/lib/cn'
import { TopNavTabs } from '@/components/organisms/TopNavTabs'
import { MobileBottomNav } from '@/components/organisms/MobileBottomNav'
import { WorkspaceSetupBanner } from '@/features/workspace/WorkspaceSetupBanner'
import { CommandPalette } from '@/components/organisms/CommandPalette'
import { useUserStore } from '@/stores/userStore'
import { useAuth } from '@/providers/AuthProvider'

const NotificationBell = dynamic(
  () => import('@/components/molecules/NotificationBell/NotificationBell').then((m) => m.NotificationBell),
  { ssr: false },
)

const UserMenu = dynamic(
  () => import('@/components/molecules/UserMenu/UserMenu').then((m) => m.UserMenu),
  { ssr: false },
)

interface DashboardLayoutProps {
  children: React.ReactNode
}

function DashboardSkeleton() {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="shrink-0 border-b border-border">
        <div className={cn(PAGE_FRAME_CLASS, DASHBOARD_HEADER_BAR_CLASS)} aria-hidden />
      </header>
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <PageLoadingCenter className="min-h-0 flex-1" />
      </main>
    </div>
  )
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { t } = useTranslation()
  const pathname = usePathname()
  const router = useRouter()
  const profileLoaded = useUserStore((s) => s.profileLoaded)
  const { user: authUser, isLoading: authLoading } = useAuth()
  const isStudioSettings = pathname.startsWith('/settings/studio')
  const isProspectList = pathname === '/prospects'
  const isProspectDetail =
    /^\/prospects\/[^/]+$/.test(pathname) &&
    !pathname.endsWith('/proposal') &&
    !pathname.endsWith('/offer')
  // Profile uses the same full-height shell as Studio Settings (320 sidebar +
  // scrolling main pane), but keeps the standard app header so the user can
  // still see TopNav tabs and the user menu.
  const isProspectWorkspaceShell = isProspectList || isProspectDetail
  const isFullHeightShell =
    isStudioSettings || pathname.startsWith('/profile') || isProspectWorkspaceShell

  if (authLoading || (authUser && !profileLoaded)) {
    return <DashboardSkeleton />
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="shrink-0 border-b border-border">
        <div
          className={cn(
            PAGE_FRAME_CLASS,
            DASHBOARD_HEADER_BAR_CLASS,
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {isStudioSettings ? (
              <p className="min-w-0 truncate text-sm font-semibold text-foreground md:text-base">
                {t('settingsPage.title')}
              </p>
            ) : (
              <>
                <AppBrandMarkLink className="lg:hidden" />

                <div className="hidden lg:flex lg:items-center lg:gap-4">
                  <AppBrandMarkLink />
                  <div className="h-5 w-px bg-border" />
                  <TopNavTabs />
                </div>
              </>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2 max-lg:gap-2.5">
            {isStudioSettings ? (
              <IconButton
                icon={X}
                label={t('settingsPage.exitStudioSetupAria')}
                onClick={() => router.push('/')}
              />
            ) : (
              <>
                <NotificationBell />
                <UserMenu />
              </>
            )}
          </div>
        </div>
      </header>

      <main
        className={cn(
          'flex-1',
          isProspectDetail
            ? 'max-lg:pb-0 lg:pb-0'
            : isProspectWorkspaceShell
              ? 'max-lg:pb-0 lg:pb-[var(--page-bottom-inset)]'
              : 'pb-[var(--page-bottom-inset)]',
          isFullHeightShell
            ? 'flex min-h-0 flex-col max-lg:overflow-y-auto lg:overflow-hidden'
            : 'flex min-h-0 flex-col overflow-y-auto',
        )}
      >
        <WorkspaceSetupBanner />
        {children}
      </main>

      <MobileBottomNav />
      <CommandPalette />
    </div>
  )
}
