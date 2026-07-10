'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { StudioDetailWithRelationsSidebar } from '@/features/studio-settings/components/StudioDetailWithRelationsSidebar'
import { StudioReviewEditorForm } from '@/features/studio-settings/components/StudioReviewEditorForm'
import { StudioSalesDetailHeader } from '@/features/studio-settings/components/StudioSalesDetailHeader'
import { reviewCardTitle } from '@/features/studio-settings/lib/studioReviewDisplay'
import { studioGhostAction, studioSectionStack } from '@/features/studio-settings/studioBlockChrome'
import { useStudioProfileStore } from '@/stores/studioProfileStore'
import { studioReviewsListPath } from '@/lib/studio/studioSalesPaths'

export function StudioReviewDetailSection() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const params = useParams<{ reviewId: string }>()
  const reviewId = params.reviewId
  const listHref = studioReviewsListPath(pathname)
  const reviews = useStudioProfileStore((s) => s.reviews)

  const row = useMemo(() => reviews.find((r) => r.id === reviewId), [reviews, reviewId])
  const headerTitle = row
    ? reviewCardTitle(row, t('studioSettings.reviews.listRowUntitled'))
    : t('studioSettings.reviews.listRowUntitled')

  if (!reviewId || !row) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted">{t('studioSettings.reviews.notFound')}</p>
        <Link href={listHref} className={studioGhostAction}>
          {t('studioSettings.backToReviews')}
        </Link>
      </div>
    )
  }

  return (
    <StudioDetailWithRelationsSidebar entity={{ kind: 'review', id: reviewId }}>
      <div className={studioSectionStack}>
        <StudioSalesDetailHeader backHref={listHref} backLabelKey="studioSettings.backToReviews" title={headerTitle} />
        <StudioReviewEditorForm reviewId={reviewId} />
      </div>
    </StudioDetailWithRelationsSidebar>
  )
}
