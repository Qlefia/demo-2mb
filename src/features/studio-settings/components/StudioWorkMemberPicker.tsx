'use client'

import { useCallback, useMemo, useState } from 'react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/components/atoms'
import { SearchInput } from '@/components/molecules'
import { STUDIO_RELATION_RAIL_DESC_CHARS } from '@/features/studio-settings/constants'
import { StudioRelationListShell } from '@/features/studio-settings/components/StudioRelationListShell'
import { stripHtmlToPlain } from '@/features/studio-settings/lib/stripHtmlToPlain'
import { studioWorkThumbSrc } from '@/features/studio-settings/lib/studioWorkThumb'
import {
  studioBlockStack,
  studioMemberRow,
  studioMemberRowRail,
  studioMemberRowRailSelected,
  studioRelationMemberList,
  studioMemberRowSelected,
  studioRadiusNested,
  studioRelationMemberThumb,
  studioSortableStack,
} from '@/features/studio-settings/studioBlockChrome'
import { useStudioProfileStore } from '@/stores/studioProfileStore'
import type { StudioWork } from '@/stores/studioProfileTypes'
import { cn } from '@/lib/cn'

export type StudioWorkMemberPickerProps = {
  selectedIds: readonly string[]
  onToggleSelected: (workId: string) => void
  canTurnOn?: (workId: string) => boolean
  emptyWorksMessage?: string
  layout?: 'default' | 'rail'
}

function workRowTitle(w: StudioWork, untitled: string): string {
  return w.headline.trim() || w.title.trim() || untitled
}

function WorkMemberThumb({ src, className }: { src: string | null; className: string }) {
  if (src) {
    return (
      <Image src={src} alt="" width={48} height={36} className={className} unoptimized />
    )
  }
  return <span className={className} aria-hidden />
}

export function StudioWorkMemberPicker({
  selectedIds,
  onToggleSelected,
  canTurnOn,
  emptyWorksMessage,
  layout = 'default',
}: StudioWorkMemberPickerProps) {
  const { t } = useTranslation()
  const works = useStudioProfileStore((s) => s.works)
  const isRail = layout === 'rail'

  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const untitled = t('studioSettings.works.untitled')

  const filteredWorks = useMemo(() => {
    if (!q) return works
    return works.filter((w) => {
      const title = workRowTitle(w, untitled).toLowerCase()
      const excerpt = stripHtmlToPlain(w.description, 500).toLowerCase()
      return (
        title.includes(q) ||
        excerpt.includes(q) ||
        w.clientName.toLowerCase().includes(q) ||
        w.locationLabel.toLowerCase().includes(q)
      )
    })
  }, [works, q, untitled])

  const displayWorkIds = useMemo(() => {
    const poolIds = q ? filteredWorks.map((w) => w.id) : works.map((w) => w.id)
    const poolSet = new Set(poolIds)
    const selectedOrdered = selectedIds.filter((id) => poolSet.has(id))
    const selectedSet = new Set(selectedOrdered)
    const unselectedOrdered = poolIds.filter((id) => !selectedSet.has(id))
    return [...selectedOrdered, ...unselectedOrdered]
  }, [filteredWorks, q, selectedIds, works])

  const isSelected = useCallback((id: string) => selectedIds.includes(id), [selectedIds])

  const tryToggle = useCallback(
    (workId: string) => {
      if (isSelected(workId)) {
        onToggleSelected(workId)
        return
      }
      if (canTurnOn && !canTurnOn(workId)) return
      onToggleSelected(workId)
    },
    [canTurnOn, isSelected, onToggleSelected],
  )

  const emptyMessage = emptyWorksMessage ?? t('studioSettings.reviews.linkedWorksEmptyCatalog')

  const searchToolbar = (
    <SearchInput
      value={query}
      onChange={setQuery}
      placeholder={t('studioSettings.works.searchWorks')}
      className="min-w-0"
      inputClassName={isRail ? 'h-8 text-xs' : undefined}
    />
  )

  const renderWorkList = () => {
    if (filteredWorks.length === 0) {
      return (
        <p className={cn('text-muted', isRail ? 'px-2 py-3 text-center text-[10px]' : 'text-sm')}>
          {t('studioSettings.works.worksEmptyFiltered')}
        </p>
      )
    }

    return (
      <ul
        className={isRail ? studioRelationMemberList : studioSortableStack}
        aria-label={t('studioSettings.works.listAria')}
      >
        {displayWorkIds.map((id) => {
          const w = works.find((x) => x.id === id)
          if (!w) return null
          const selected = isSelected(id)
          const turnOnBlocked = !selected && canTurnOn !== undefined && !canTurnOn(id)
          const title = workRowTitle(w, untitled)
          const thumbSrc = studioWorkThumbSrc(w)
          const descExcerpt = stripHtmlToPlain(w.description, STUDIO_RELATION_RAIL_DESC_CHARS).trim()

          if (isRail) {
            return (
              <li key={id}>
                <div
                  className={cn(
                    studioMemberRowRail,
                    selected && studioMemberRowRailSelected,
                    turnOnBlocked && 'opacity-60',
                  )}
                >
                  <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selected}
                      disabled={turnOnBlocked}
                      onChange={(next) => {
                        if (next !== selected) tryToggle(id)
                      }}
                      ariaLabel={t('studioSettings.reviews.workMemberCheckboxAria', { title })}
                    />
                  </div>
                  <button
                    type="button"
                    aria-pressed={selected}
                    disabled={turnOnBlocked}
                    onClick={() => tryToggle(id)}
                    className={cn(
                      'flex min-h-0 min-w-0 flex-1 items-center gap-2 px-1 py-0.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
                      studioRadiusNested,
                    )}
                  >
                    <WorkMemberThumb src={thumbSrc} className={studioRelationMemberThumb} />
                    <span className="flex min-h-0 min-w-0 flex-1 flex-col justify-center">
                      <span className="block truncate text-[11px] font-semibold leading-snug text-foreground">
                        {title}
                      </span>
                      {descExcerpt ? (
                        <span className="mt-0.5 block truncate text-[10px] leading-tight text-muted">
                          {descExcerpt}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </div>
              </li>
            )
          }

          return (
            <li key={id}>
              <div className={cn(studioMemberRow, selected && studioMemberRowSelected)}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center" aria-hidden />
                <div className="shrink-0 self-center pt-0.5" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selected}
                    disabled={turnOnBlocked}
                    onChange={(next) => {
                      if (next !== selected) tryToggle(id)
                    }}
                    ariaLabel={t('studioSettings.reviews.workMemberCheckboxAria', { title })}
                  />
                </div>
                <button
                  type="button"
                  aria-pressed={selected}
                  disabled={turnOnBlocked}
                  onClick={() => tryToggle(id)}
                  className={cn(
                    'flex min-w-0 flex-1 items-center gap-2 px-1 py-0.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
                    studioRadiusNested,
                  )}
                >
                  <WorkMemberThumb
                    src={thumbSrc}
                    className="h-10 w-14 shrink-0 rounded-sm bg-muted/40 object-cover"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold leading-snug text-foreground">{title}</span>
                    {descExcerpt ? (
                      <span className="mt-0.5 block truncate text-xs leading-snug text-muted">{descExcerpt}</span>
                    ) : null}
                  </span>
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    )
  }

  if (works.length === 0) {
    if (isRail) {
      return (
        <StudioRelationListShell toolbar={searchToolbar}>
          <p className="px-2 py-3 text-center text-[10px] text-muted">{emptyMessage}</p>
        </StudioRelationListShell>
      )
    }
    return (
      <div className={studioBlockStack}>
        {searchToolbar}
        <p className="text-sm text-muted">{emptyMessage}</p>
      </div>
    )
  }

  if (isRail) {
    return (
      <StudioRelationListShell selectedCount={selectedIds.length} toolbar={searchToolbar}>
        {renderWorkList()}
      </StudioRelationListShell>
    )
  }

  return (
    <div className={studioBlockStack}>
      {searchToolbar}
      <div className="min-w-0">{renderWorkList()}</div>
    </div>
  )
}
