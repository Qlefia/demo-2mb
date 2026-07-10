'use client'

import Link from 'next/link'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center border-b border-border px-4">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          SurveyBuilder
        </Link>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
