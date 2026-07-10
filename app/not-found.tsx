'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Button, Container } from '@/components/atoms'

export default function NotFound() {
  const { t } = useTranslation()

  return (
    <Container className="flex min-h-screen flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-bold text-muted">404</h1>
      <h2 className="mt-4 text-xl font-semibold">{t('error.pageNotFound')}</h2>
      <p className="mt-2 text-sm text-muted">{t('error.pageNotFoundDesc')}</p>
      <Link href="/" className="mt-8">
        <Button>{t('error.backToDashboard')}</Button>
      </Link>
    </Container>
  )
}
