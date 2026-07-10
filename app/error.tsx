'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/atoms'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = useTranslation()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-xl font-semibold">{t('error.somethingWentWrong')}</h1>
      <p className="text-center text-sm text-muted">{t('error.unexpectedError')}</p>
      {error.digest && (
        <p className="font-mono text-[10px] text-muted">{error.digest}</p>
      )}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={reset}>
          {t('common.back')}
        </Button>
        <Link href="/">
          <Button variant="secondary">{t('error.backToDashboard')}</Button>
        </Link>
      </div>
    </main>
  )
}
