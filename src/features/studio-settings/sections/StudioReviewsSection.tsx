'use client'

import { useCallback, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Pencil, Star, Trash2 } from 'lucide-react'
import type { DropdownMenuEntry } from '@/components/molecules'
import { ConfirmDialog } from '@/components/molecules'
import { StudioSalesListLayout, StudioSortableListCard } from '@/features/studio-settings/components'
import { useStudioSalesListIds } from '@/features/studio-settings/lib/useStudioSalesListIds'
import type { StudioSalesListFilter } from '@/features/studio-settings/lib/studioSalesListTypes'
import {
  reviewCardTitle,
  reviewExcerptHtml,
  reviewListSubtitle,
  reviewListThumbUrl,
} from '@/features/studio-settings/lib/studioReviewDisplay'
import { stripHtmlToPlain } from '@/features/studio-settings/lib/stripHtmlToPlain'
import { useStudioProfileStore } from '@/stores/studioProfileStore'
import { studioReviewEditorPath } from '@/lib/studio/studioSalesPaths'

const BLOCK = 'studio-reviews'
const BODY_PREVIEW_CHARS = 200
const MAX_LINK_CHIPS = 4

function ReviewListRatingBadge({ rating }: { rating: number }) {
  const { t } = useTranslation()
  return (
    <span
      className="inline-flex items-center gap-1 text-xs leading-none tabular-nums"
      title={t('studioSettings.reviews.rating')}
    >
      <Star size={12} className="shrink-0 fill-foreground text-foreground" aria-hidden />
      <span className="font-semibold text-foreground">{rating}</span>
    </span>
  )
}

export function StudioReviewsSection() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const router = useRouter()
  const reviews = useStudioProfileStore((s) => s.reviews)
  const works = useStudioProfileStore((s) => s.works)
  const serviceCatalog = useStudioProfileStore((s) => s.serviceCatalog)
  const removeReview = useStudioProfileStore((s) => s.removeReview)
  const reorderReviews = useStudioProfileStore((s) => s.reorderReviews)

  const [removeId, setRemoveId] = useState<string | null>(null)

  const ids = reviews.map((r) => r.id)
  const worksById = useMemo(() => new Map(works.map((w) => [w.id, w])), [works])
  const catalogById = useMemo(() => new Map(serviceCatalog.map((c) => [c.id, c])), [serviceCatalog])
  const listUntitled = t('studioSettings.reviews.listRowUntitled')

  const listState = useStudioSalesListIds({
    tab: 'reviews',
    sourceIds: ids,
    matchesFilter: useCallback(
      (id, filter: StudioSalesListFilter) => {
        const row = reviews.find((r) => r.id === id)
        if (!row) return false
        if (filter === 'rated') return row.rating !== null
        if (filter === 'unrated') return row.rating === null
        return true
      },
      [reviews],
    ),
    getSearchText: useCallback(
      (id) => {
        const row = reviews.find((r) => r.id === id)
        if (!row) return ''
        const body = stripHtmlToPlain(reviewExcerptHtml(row), BODY_PREVIEW_CHARS)
        return `${row.author} ${row.company} ${row.headline} ${body}`.trim()
      },
      [reviews],
    ),
    getTitle: useCallback(
      (id: string) => {
        const row = reviews.find((r) => r.id === id)
        return row ? reviewCardTitle(row, listUntitled) : listUntitled
      },
      [reviews, listUntitled],
    ),
    getRating: useCallback(
      (id: string) => reviews.find((r) => r.id === id)?.rating ?? null,
      [reviews],
    ),
  })

  return (
    <div className="space-y-1">
      {ids.length === 0 ? (
        <p className="text-sm text-muted">{t('studioSettings.reviews.empty')}</p>
      ) : listState.noResults ? (
        <p className="text-sm text-muted">{t('studioSettings.sales.listToolbar.noResults')}</p>
      ) : (
        <StudioSalesListLayout
          blockId={BLOCK}
          itemIds={listState.ids}
          listLabel={t('studioSettings.reviews.listAria')}
          viewMode={listState.viewMode === 'kanban' ? 'list' : listState.viewMode}
          isManualOrder={listState.isManualOrder}
          onReorder={reorderReviews}
        >
          {(id, dragHandle) => {
            const row = reviews.find((r) => r.id === id)
            if (!row) return null
            const title = reviewCardTitle(row, t('studioSettings.reviews.listRowUntitled'))
            const excerpt = stripHtmlToPlain(reviewExcerptHtml(row), BODY_PREVIEW_CHARS).trim()
            const thumb = reviewListThumbUrl(row)
            const href = studioReviewEditorPath(pathname, id)

            const workChips = row.linkedWorkIds
              .map((wid) => {
                const w = worksById.get(wid)
                const label = w?.title.trim() || w?.headline.trim()
                return label ? { id: wid, label } : null
              })
              .filter((x): x is { id: string; label: string } => x !== null)

            const catalogChips = row.linkedCatalogIds
              .map((cid) => {
                const line = catalogById.get(cid)
                const label = line?.title.trim()
                return label ? { id: cid, label } : null
              })
              .filter((x): x is { id: string; label: string } => x !== null)

            const chipEntries = [...workChips, ...catalogChips]
            const shownChips = chipEntries.slice(0, MAX_LINK_CHIPS)
            const overflowCount = Math.max(0, chipEntries.length - shownChips.length)

            const menuItems: DropdownMenuEntry[] = [
              {
                label: t('studioSettings.edit'),
                icon: Pencil,
                onClick: () => router.push(href),
              },
              { separator: true },
              {
                label: t('studioSettings.remove'),
                icon: Trash2,
                variant: 'destructive',
                onClick: () => setRemoveId(id),
              },
            ]

            return (
              <StudioSortableListCard
                dragHandle={dragHandle}
                href={href}
                menuTriggerAriaLabel={t('studioSettings.sortableListCardMenuAria')}
                menuItems={menuItems}
                thumbnailUrl={thumb}
                eyebrow={(row.headline ?? '').trim() || null}
                title={title}
                topEndAdornment={
                  row.rating !== null ? <ReviewListRatingBadge rating={row.rating} /> : null
                }
                subtitle={reviewListSubtitle(row)}
                description={excerpt.length > 0 ? excerpt : null}
                chips={shownChips}
                chipsOverflowCount={overflowCount}
                chipsOverflowLabel={
                  overflowCount > 0
                    ? t('studioSettings.works.listPreview.moreServices', { count: overflowCount })
                    : null
                }
              />
            )
          }}
        </StudioSalesListLayout>
      )}

      <ConfirmDialog
        open={removeId !== null}
        onClose={() => setRemoveId(null)}
        onConfirm={() => {
          if (removeId) removeReview(removeId)
          setRemoveId(null)
        }}
        title={t('studioSettings.reviews.confirmRemoveTitle')}
        message={t('studioSettings.reviews.confirmRemoveBody')}
        variant="destructive"
        confirmLabel={t('studioSettings.remove')}
      />
    </div>
  )
}
