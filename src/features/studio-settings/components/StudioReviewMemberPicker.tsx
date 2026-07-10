'use client'

import { useCallback, useMemo, useState } from 'react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/components/atoms'
import { SearchInput } from '@/components/molecules'
import { STUDIO_RELATION_RAIL_DESC_CHARS } from '@/features/studio-settings/constants'
import { StudioRelationListShell } from '@/features/studio-settings/components/StudioRelationListShell'
import {
  reviewCardTitle,
  reviewExcerptHtml,
  reviewListThumbUrl,
} from '@/features/studio-settings/lib/studioReviewDisplay'
import { stripHtmlToPlain } from '@/features/studio-settings/lib/stripHtmlToPlain'
import {
  studioBlockStack,
  studioMemberRow,
  studioMemberRowRail,
  studioMemberRowRailSelected,
  studioMemberRowSelected,
  studioRadiusNested,
  studioRelationMemberList,
  studioRelationTypeTag,
  studioSortableStack,
} from '@/features/studio-settings/studioBlockChrome'
import { useStudioProfileStore } from '@/stores/studioProfileStore'
import type { StudioReview } from '@/stores/studioProfileTypes'
import { cn } from '@/lib/cn'

export type StudioReviewRowMeta = {
  disabled?: boolean
  statusTag?: string | null
}

export type StudioReviewMemberPickerProps = {
  selectedIds: readonly string[]
  onToggleSelected: (reviewId: string) => void
  canTurnOn?: (reviewId: string) => boolean
  getRowMeta?: (review: StudioReview) => StudioReviewRowMeta | undefined
  emptyMessage?: string
  layout?: 'default' | 'rail'
}

function reviewRowSubtitle(r: StudioReview): string | null {
  const role = r.role.trim()
  const company = r.company.trim()
  if (role && company) return `${role} · ${company}`
  return role || company || (r.subtitle ?? '').trim() || null
}

function ReviewMemberThumb({ src, className }: { src: string | null; className: string }) {
  if (src) {
    return (
      <Image src={src} alt="" width={36} height={36} className={className} unoptimized />
    )
  }
  return <span className={className} aria-hidden />
}

export function StudioReviewMemberPicker({
  selectedIds,
  onToggleSelected,
  canTurnOn,
  getRowMeta,
  emptyMessage,
  layout = 'default',
}: StudioReviewMemberPickerProps) {
  const { t } = useTranslation()
  const reviews = useStudioProfileStore((s) => s.reviews)
  const isRail = layout === 'rail'

  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const untitled = t('studioSettings.reviews.listRowUntitled')
  const filteredReviews = useMemo(() => {
    if (!q) return reviews
    return reviews.filter((r) => {
      const title = reviewCardTitle(r, untitled).toLowerCase()
      const excerpt = stripHtmlToPlain(reviewExcerptHtml(r), 500).toLowerCase()
      return (
        title.includes(q) ||
        excerpt.includes(q) ||
        r.author.toLowerCase().includes(q) ||
        r.company.toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q)
      )
    })
  }, [reviews, q, untitled])

  const displayReviewIds = useMemo(() => {
    const poolIds = q ? filteredReviews.map((r) => r.id) : reviews.map((r) => r.id)
    const poolSet = new Set(poolIds)
    const selectedOrdered = selectedIds.filter((id) => poolSet.has(id))
    const selectedSet = new Set(selectedOrdered)
    const unselectedOrdered = poolIds.filter((id) => !selectedSet.has(id))
    return [...selectedOrdered, ...unselectedOrdered]
  }, [filteredReviews, q, selectedIds, reviews])

  const isSelected = useCallback((id: string) => selectedIds.includes(id), [selectedIds])

  const tryToggle = useCallback(
    (reviewId: string) => {
      if (isSelected(reviewId)) {
        onToggleSelected(reviewId)
        return
      }
      if (canTurnOn && !canTurnOn(reviewId)) return
      onToggleSelected(reviewId)
    },
    [canTurnOn, isSelected, onToggleSelected],
  )

  const emptyMsg = emptyMessage ?? t('studioSettings.relationsSidebar.emptyReviews')

  const searchToolbar = (
    <SearchInput
      value={query}
      onChange={setQuery}
      placeholder={t('studioSettings.reviews.searchReviews')}
      className="min-w-0"
      inputClassName={isRail ? 'h-8 text-xs' : undefined}
    />
  )

  const reviewThumbSquare = cn(
    'h-9 w-9 shrink-0 overflow-hidden bg-muted/40 object-cover',
    studioRadiusNested,
  )

  const renderReviewList = () => {
    if (filteredReviews.length === 0) {
      return (
        <p className={cn('text-muted', isRail ? 'px-2 py-3 text-center text-[10px]' : 'text-sm')}>
          {q ? t('studioSettings.reviews.reviewsEmptyFiltered') : emptyMsg}
        </p>
      )
    }

    return (
      <ul
        className={isRail ? studioRelationMemberList : studioSortableStack}
        aria-label={t('studioSettings.reviews.listAria')}
      >
        {displayReviewIds.map((id) => {
          const r = reviews.find((x) => x.id === id)
          if (!r) return null
          const meta = getRowMeta?.(r)
          const disabled = meta?.disabled === true
          const selected = isSelected(id)
          const turnOnBlocked = !selected && !disabled && canTurnOn !== undefined && !canTurnOn(id)
          const title = reviewCardTitle(r, untitled)
          const subtitle = reviewRowSubtitle(r)
          const thumbSrc = reviewListThumbUrl(r)
          const quoteExcerpt = stripHtmlToPlain(reviewExcerptHtml(r), STUDIO_RELATION_RAIL_DESC_CHARS).trim()
          const ratingTag =
            meta?.statusTag !== undefined
              ? meta.statusTag
              : r.rating != null
                ? `${r.rating}/5`
                : null
          if (isRail) {
            return (
              <li key={id}>
                <div
                  className={cn(
                    studioMemberRowRail,
                    selected && studioMemberRowRailSelected,
                    (disabled || turnOnBlocked) && 'opacity-60',
                  )}
                >
                  <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selected}
                      disabled={disabled || turnOnBlocked}
                      onChange={(next) => {
                        if (next !== selected) tryToggle(id)
                      }}
                      ariaLabel={t('studioSettings.reviews.reviewMemberCheckboxAria', { title })}
                    />
                  </div>
                  <button
                    type="button"
                    aria-pressed={selected}
                    disabled={disabled || turnOnBlocked}
                    onClick={() => tryToggle(id)}
                    className={cn(
                      'flex min-h-0 min-w-0 flex-1 items-center gap-2 px-1 py-0.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
                      studioRadiusNested,
                    )}
                  >
                    <ReviewMemberThumb src={thumbSrc} className={reviewThumbSquare} />
                    <span className="flex min-h-0 min-w-0 flex-1 flex-col justify-center">
                      <span className="block truncate text-[11px] font-semibold leading-snug text-foreground">
                        {title}
                      </span>
                      {subtitle ? (
                        <span className="mt-0.5 block truncate text-[10px] leading-tight text-muted">
                          {subtitle}
                        </span>
                      ) : null}
                      {quoteExcerpt ? (
                        <span className="mt-0.5 block truncate text-[10px] leading-tight text-muted">
                          {quoteExcerpt}
                        </span>
                      ) : null}
                    </span>
                  </button>
                  {ratingTag ? (
                    <span className={cn(studioRelationTypeTag, 'shrink-0')}>{ratingTag}</span>
                  ) : null}
                </div>
              </li>
            )
          }

          return (
            <li key={id}>
              <div
                className={cn(
                  studioMemberRow,
                  selected && studioMemberRowSelected,
                  (disabled || turnOnBlocked) && 'opacity-60',
                )}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center" aria-hidden />
                <div className="shrink-0 self-center pt-0.5" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selected}
                    disabled={disabled || turnOnBlocked}
                    onChange={(next) => {
                      if (next !== selected) tryToggle(id)
                    }}
                    ariaLabel={t('studioSettings.reviews.reviewMemberCheckboxAria', { title })}
                  />
                </div>
                <button
                  type="button"
                  aria-pressed={selected}
                  disabled={disabled || turnOnBlocked}
                  onClick={() => tryToggle(id)}
                  className={cn(
                    'flex min-w-0 flex-1 items-center gap-2 px-1 py-0.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
                    studioRadiusNested,
                  )}
                >
                  <ReviewMemberThumb src={thumbSrc} className="h-10 w-10 shrink-0 rounded-sm bg-muted/40 object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold leading-snug text-foreground">{title}</span>
                    {subtitle ? (
                      <span className="mt-0.5 block truncate text-xs leading-snug text-muted">{subtitle}</span>
                    ) : null}
                  </span>
                </button>
                {ratingTag ? (
                  <span className="shrink-0 pr-2 text-xs tabular-nums text-muted">{ratingTag}</span>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    )
  }

  if (reviews.length === 0) {
    if (isRail) {
      return (
        <StudioRelationListShell toolbar={searchToolbar}>
          <p className="px-2 py-3 text-center text-[10px] text-muted">{emptyMsg}</p>
        </StudioRelationListShell>
      )
    }
    return (
      <div className={studioBlockStack}>
        {searchToolbar}
        <p className="text-sm text-muted">{emptyMsg}</p>
      </div>
    )
  }

  if (isRail) {
    return (
      <StudioRelationListShell selectedCount={selectedIds.length} toolbar={searchToolbar}>
        {renderReviewList()}
      </StudioRelationListShell>
    )
  }

  return (
    <div className={studioBlockStack}>
      {searchToolbar}
      <div className="min-w-0">{renderReviewList()}</div>
    </div>
  )
}
