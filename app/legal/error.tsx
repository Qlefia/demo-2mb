'use client'

import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import { Button, Container } from '@/components/atoms'

export default function LegalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = useTranslation()

  return (
    <Container className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <h1 className="text-xl font-semibold">{t('error.somethingWentWrong')}</h1>
      <p className="mt-2 text-sm text-muted">{t('error.unexpectedError')}</p>
      <div className="mt-6 flex gap-3">
        <Button variant="secondary" onClick={reset}>
          {t('common.back')}
        </Button>
        <Link href="/">
          <Button>{t('error.backToDashboard')}</Button>
        </Link>
      </div>
    </Container>
  )
}
