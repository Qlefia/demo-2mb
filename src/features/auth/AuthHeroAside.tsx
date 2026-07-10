'use client'

import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { RegisterMarketingCard } from '@/features/auth/RegisterMarketingCard'

const heroSrc =
  typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_AUTH_MARKETING_IMAGE ?? '').trim() : ''

export type AuthHeroVariant = 'register' | 'login'

export function AuthHeroAside({ variant }: { variant: AuthHeroVariant }) {
  const { t } = useTranslation()

  if (heroSrc) {
    return (
      <aside
        className={cn(
          'relative flex min-h-[min(440px,50vh)] w-full flex-1 overflow-hidden lg:min-h-svh lg:w-1/2 lg:self-stretch',
          'lg:rounded-l-3xl',
        )}
      >
        <div className="absolute inset-0">
          <Image
            src={heroSrc}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            unoptimized
            priority={false}
          />
        </div>
        <div
          className="absolute inset-0 bg-linear-to-t from-black/55 via-black/10 to-transparent"
          aria-hidden
        />
        <p className="absolute bottom-8 left-6 right-6 z-10 text-balance text-sm font-medium text-white/95 sm:left-10 sm:right-10 lg:left-12 lg:right-12">
          {variant === 'login' ? t('auth.loginHeroCaption') : t('auth.registerHeroCaption')}
        </p>
      </aside>
    )
  }

  if (variant === 'register') {
    return (
      <aside className="relative flex min-h-[min(440px,50vh)] w-full flex-1 lg:min-h-svh lg:w-1/2 lg:self-stretch">
        <RegisterMarketingCard />
      </aside>
    )
  }

  return (
    <aside
      className={cn(
        'register-marketing-isolated register-marketing-paper relative flex min-h-[min(440px,50vh)] w-full flex-1 flex-col justify-end overflow-hidden rounded-3xl lg:min-h-svh lg:w-1/2 lg:rounded-none lg:rounded-l-3xl',
      )}
    >
      <div className="register-marketing-blobs" aria-hidden>
        <span className="register-marketing-blob register-marketing-blob--1" />
        <span className="register-marketing-blob register-marketing-blob--2" />
      </div>
      <div className="register-marketing-noise" aria-hidden />
      <div className="relative z-10 px-8 pb-12 pt-8 sm:px-12 lg:pb-16">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-accent">
          {t('auth.loginHeroEyebrow')}
        </p>
        <h2 className="mt-3 max-w-md text-balance text-2xl font-semibold tracking-tight text-neutral-950">
          {t('auth.loginHeroTitle')}
        </h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-600">{t('auth.loginHeroBody')}</p>
      </div>
    </aside>
  )
}
