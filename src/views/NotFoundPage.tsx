'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/atoms'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-muted">{t('error.pageNotFound')}</p>
      <Link href="/">
        <Button>{t('error.backToDashboard')}</Button>
      </Link>
    </main>
  )
}
