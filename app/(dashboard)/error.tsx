'use client'

import { useTranslation } from 'react-i18next'
import { Button, Container } from '@/components/atoms'

export default function DashboardError({
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
      <Button className="mt-6" onClick={reset}>
        {t('error.backToDashboard')}
      </Button>
    </Container>
  )
}
