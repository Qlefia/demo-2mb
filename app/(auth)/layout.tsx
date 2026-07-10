'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MoreHorizontal } from 'lucide-react'
import { ThemeToggle } from '@/components/molecules/ThemeToggle'
import { LanguageSwitcher } from '@/components/molecules/LanguageSwitcher'
import { DropdownMenu } from '@/components/molecules/DropdownMenu'
import { IconButton } from '@/components/atoms'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { AuthLegalFooterLinks } from '@/features/auth/AuthLegalFooterLinks'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const pathname = usePathname()
  const isRegister = pathname === '/register'
  const isLogin = pathname === '/login'
  const isAuthSplit = isRegister || isLogin

  return (
    <div
      className={cn(
        'flex min-h-screen flex-col bg-background',
        isAuthSplit &&
          'bg-[radial-gradient(ellipse_90%_55%_at_50%_-18%,rgba(163,241,157,0.16),transparent)] dark:bg-[radial-gradient(ellipse_90%_55%_at_50%_-18%,rgba(34,197,94,0.1),transparent)]',
      )}
    >
      {!isAuthSplit && (
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 md:px-6">
          <Link href="/login" className="text-base font-semibold tracking-tight">
            2mb CRM
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <DropdownMenu
              trigger={
                <IconButton
                  icon={MoreHorizontal}
                  label={t('nav.menu')}
                  variant="ghost"
                  size="sm"
                />
              }
              items={[
                { label: t('auth.aboutService'), onClick: () => {} },
              ]}
            />
          </div>
        </header>
      )}
      <main
        className={cn(
          'flex min-h-0 flex-1 flex-col',
          isAuthSplit ? 'w-full items-stretch p-0' : 'items-center justify-center px-4 py-10 md:py-12',
        )}
      >
        {children}
      </main>
      {!isAuthSplit && (
        <footer className="shrink-0 border-t border-border px-4 py-3">
          <AuthLegalFooterLinks />
        </footer>
      )}
    </div>
  )
}
