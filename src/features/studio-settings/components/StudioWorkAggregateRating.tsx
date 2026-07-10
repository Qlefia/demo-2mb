'use client'

import { useTranslation } from 'react-i18next'
import { Star } from 'lucide-react'
import {
  formatAggregateRatingValue,
  type StudioWorkAggregateRating,
} from '@/features/studio-settings/lib/studioWorkAggregateRating'
import { cn } from '@/lib/cn'

type StudioWorkAggregateRatingProps = {
  rating: StudioWorkAggregateRating
  className?: string
}

export function StudioWorkAggregateRatingBadge({ rating, className }: StudioWorkAggregateRatingProps) {
  const { t } = useTranslation()
  const formatted = formatAggregateRatingValue(rating.average)
  const hint = t('studioSettings.works.aggregateRatingHint', {
    average: formatted,
    count: rating.count,
  })

  return (
    <span
      className={cn('inline-flex items-center gap-1 text-xs leading-none tabular-nums', className)}
      title={hint}
    >
      <Star size={12} className="shrink-0 fill-foreground text-foreground" aria-hidden />
      <span className="font-semibold text-foreground">{formatted}</span>
      <span className="text-muted/60" aria-hidden>
        ·
      </span>
      <span className="text-muted">
        {rating.count === 1
          ? t('studioSettings.works.aggregateRatingCountShort_one')
          : t('studioSettings.works.aggregateRatingCountShort_other', { count: rating.count })}
      </span>
      <span className="sr-only">
        {t('studioSettings.works.aggregateRatingAria', { average: formatted, count: rating.count })}
      </span>
    </span>
  )
}
