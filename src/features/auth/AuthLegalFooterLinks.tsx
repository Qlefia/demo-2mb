'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'

type Props = {
  className?: string
  /** default: centered (login layout); start: left under register form */
  align?: 'center' | 'start'
}

export function AuthLegalFooterLinks({ className, align = 'center' }: Props) {
  const { t } = useTranslation()
  return (
    <nav
      className={cn(
        'flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted',
        align === 'center' ? 'items-center justify-center' : 'items-center justify-start',
        className,
      )}
      aria-label="Legal"
    >
      <Link href="/legal/impressum" className="hover:text-foreground">
        {t('footer.impressum')}
      </Link>
      <Link href="/legal/privacy" className="hover:text-foreground">
        {t('footer.privacy')}
      </Link>
      <Link href="/legal/terms" className="hover:text-foreground">
        {t('footer.terms')}
      </Link>
      <Link href="/legal/cookies" className="hover:text-foreground">
        {t('footer.cookies')}
      </Link>
    </nav>
  )
}
