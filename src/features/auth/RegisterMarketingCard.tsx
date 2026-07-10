'use client'

import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'

const registerPitchIndices = ['01', '02', '03'] as const

export function RegisterMarketingCard() {
  const { t } = useTranslation()

  const points = [
    { title: t('auth.registerPitch1Title'), body: t('auth.registerPitch1Body') },
    { title: t('auth.registerPitch2Title'), body: t('auth.registerPitch2Body') },
    { title: t('auth.registerPitch3Title'), body: t('auth.registerPitch3Body') },
  ]

  return (
    <div
      className={cn(
        'register-marketing-isolated register-marketing-paper relative flex h-full min-h-[min(380px,48vh)] flex-col overflow-hidden rounded-3xl',
        'lg:h-full lg:min-h-svh lg:w-full lg:rounded-none lg:rounded-l-3xl',
      )}
    >
      <div className="register-marketing-blobs" aria-hidden>
        <span className="register-marketing-blob register-marketing-blob--1" />
        <span className="register-marketing-blob register-marketing-blob--2" />
        <span className="register-marketing-blob register-marketing-blob--3" />
      </div>
      <div className="register-marketing-noise" aria-hidden />
      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col justify-center px-5 py-8 sm:px-10 sm:py-9 lg:h-full lg:px-12 lg:py-10">
        <header className="text-center">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-accent sm:text-[0.72rem]">
            {t('auth.registerPitchEyebrow')}
          </p>
          <h2 className="mx-auto mt-3 max-w-[20rem] text-balance text-[1.65rem] font-semibold leading-[1.2] tracking-tight text-neutral-950 sm:max-w-[24rem] sm:text-[1.85rem] md:max-w-104 md:text-[2rem]">
            {t('auth.registerPitchTitle')}
          </h2>
        </header>

        <ul className="mt-8 flex w-full flex-col gap-9 sm:mt-10 sm:gap-10">
          {points.map(({ title, body }, index) => (
            <li
              key={index}
              className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:gap-6 sm:text-left"
            >
              <span
                className={cn(
                  'select-none font-light tabular-nums tracking-tight text-accent',
                  'text-[2rem] leading-none sm:w-12 sm:shrink-0 sm:pt-0.5 sm:text-[1.75rem]',
                )}
                aria-hidden
              >
                {registerPitchIndices[index]}
              </span>
              <div className="min-w-0 max-w-md sm:max-w-none">
                <p className="text-[1.05rem] font-semibold leading-snug text-neutral-950 sm:text-[1.125rem]">
                  {title}
                </p>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-neutral-600 sm:text-base">
                  {body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
