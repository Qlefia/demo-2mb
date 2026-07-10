'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { LanguageSwitcher } from '@/components/molecules/LanguageSwitcher'
import { ThemeToggle } from '@/components/molecules/ThemeToggle'
import { AuthLegalFooterLinks } from '@/features/auth/AuthLegalFooterLinks'
import { AuthHeroAside, type AuthHeroVariant } from '@/features/auth/AuthHeroAside'

export function AuthMarketingSplitLayout({
  children,
  variant,
}: {
  children: ReactNode
  variant: AuthHeroVariant
}) {
  return (
    <div className="flex min-h-svh w-full flex-1 flex-col lg:min-h-svh lg:flex-row lg:items-stretch">
      <div className="flex w-full flex-1 flex-col lg:min-h-svh lg:w-1/2 lg:justify-between">
        <div className="flex w-full shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 pt-5 sm:px-10 lg:px-12 lg:pt-6 xl:px-16">
          <Link href="/login" className="shrink-0 text-base font-semibold tracking-tight text-foreground">
            2mb CRM
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
        <div className="flex flex-1 flex-col items-center px-6 pb-10 pt-6 sm:px-10 lg:min-h-0 lg:px-12 lg:pb-10 lg:pt-4 xl:px-16">
          <div className="flex w-full flex-1 flex-col items-center justify-center">
            <div className="w-full max-w-md">{children}</div>
          </div>
          <AuthLegalFooterLinks
            align="center"
            className="mt-10 w-full max-w-md shrink-0 lg:mt-0 lg:pb-1 lg:pt-8"
          />
        </div>
      </div>
      <AuthHeroAside variant={variant} />
    </div>
  )
}
