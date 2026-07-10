'use client'

import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'

interface SpinnerProps {
  size?: number
  className?: string
}

/** Default footprint for full-page / route loading states. */
export const PAGE_SPINNER_SIZE = 40

const DOT_DELAYS_S = [0, 0.16, 0.32] as const

/**
 * Three-dot wave loader (Swiss-clean): staggered scale + opacity pulse.
 * `size` sets the overall footprint; color follows `currentColor`.
 */
export function Spinner({ size = 20, className = '' }: SpinnerProps) {
  const { t } = useTranslation()
  const dotSize = Math.max(4, Math.round(size / 4))
  const gap = Math.max(3, Math.round(size / 6))

  return (
    <span
      role="status"
      aria-label={t('common.loading')}
      className={cn('inline-flex shrink-0 items-center justify-center text-muted', className)}
      style={{ gap, height: size }}
    >
      {DOT_DELAYS_S.map((delay) => (
        <span
          key={delay}
          className="motion-safe:animate-spinner-dot rounded-full bg-current"
          style={{
            width: dotSize,
            height: dotSize,
            animationDelay: `${delay}s`,
          }}
        />
      ))}
    </span>
  )
}
