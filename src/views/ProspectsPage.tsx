'use client'

import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, IconButton } from '@/components/atoms'
import { SearchInput } from '@/components/molecules'
import { ViewModeToggle } from '@/components/molecules'
import { StudioAccentAddButton } from '@/features/studio-settings/components'
import { cn } from '@/lib/cn'
import { PAGE_FRAME_CLASS, PAGE_SECTION_STACK } from '@/lib/layout/pageFrame'
import { useProspectStore } from '@/stores/prospectStore'
import {
  AddProspectModal,
  ProspectFilters,
  ProspectKanban,
  ProspectListView,
  ProspectCardView,
  ProspectDetailPanel,
  ProspectToolbarMoreMenu,
  ProspectSort,
  ProspectGrouping,
  ProspectCardDensity,
} from '@/features/prospects'
import { useProspectsQuery } from '@/features/prospects/api'
import { STAGE_META } from '@/features/prospects/stageMeta'
import { buildStageOrderIndex, sortProspects } from '@/lib/prospects/sortProspects'
import { isProspectStage, isProspectViewMode } from '@/lib/prospects/prospectsUrl'

/**
 * Loading placeholder shaped like the real kanban (5 columns of muted cards).
 * Replaces the centered spinner — the user sees the page is loading,
 * but it doesn't feel "broken / nothing here".
 */
function KanbanSkeleton() {
  return (
    <div className="flex h-full min-h-0 gap-3 overflow-x-auto pb-4" aria-hidden>
      {[0, 1, 2, 3, 4].map((col) => (
        <section
          key={col}
          className="flex h-full max-h-full min-h-0 w-64 shrink-0 flex-col rounded-sm border border-border bg-primary/2"
        >
          <header className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
            <div className="h-3 w-20 animate-pulse rounded bg-primary/10" />
            <div className="h-3 w-6 animate-pulse rounded bg-primary/10" />
          </header>
          <div className="flex flex-col gap-2 p-2">
            {[0, 1].map((row) => (
              <div
                key={row}
                className="h-20 animate-pulse rounded-sm border border-border bg-primary/4"
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

/**
 * Companies / Prospects landing.
 *
 * Data source: TanStack Query (`useProspectsQuery`). The Zustand store only
 * holds UI preferences (view mode, sort, filters, selection). Mutations live
 * in `useProspectMutations` and patch the query cache directly — no manual
 * `setProspects` + race conditions like the previous implementation had.
 */
export function ProspectsPage() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const { data: prospects = [], isLoading, isError, refetch } = useProspectsQuery()

  const viewMode = useProspectStore((s) => s.viewMode)
  const setViewMode = useProspectStore((s) => s.setViewMode)
  const sortBy = useProspectStore((s) => s.sortBy)
  const sortOrder = useProspectStore((s) => s.sortOrder)
  const setSortBy = useProspectStore((s) => s.setSortBy)
  const setSortOrder = useProspectStore((s) => s.setSortOrder)
  const groupBy = useProspectStore((s) => s.groupBy)
  const setGroupBy = useProspectStore((s) => s.setGroupBy)
  const cardsPerRow = useProspectStore((s) => s.cardsPerRow)
  const setCardsPerRow = useProspectStore((s) => s.setCardsPerRow)
  const filters = useProspectStore((s) => s.filters)
  const setFilter = useProspectStore((s) => s.setFilter)
  const selectedId = useProspectStore((s) => s.selectedProspectId)
  const setSelectedId = useProspectStore((s) => s.setSelectedProspectId)

  const [addOpen, setAddOpen] = useState(false)

  useEffect(() => {
    const stage = searchParams.get('stage')
    if (stage && isProspectStage(stage)) {
      setFilter('stage', stage)
    }
    const view = searchParams.get('view')
    if (view && isProspectViewMode(view)) {
      setViewMode(view)
    }
  }, [searchParams, setFilter, setViewMode])

  const filtered = useMemo(() => {
    return prospects.filter((p) => {
      if (filters.territory && p.territory !== filters.territory) return false
      if (filters.stage && p.stage !== filters.stage) return false
      if (filters.ownerId && p.ownerId !== filters.ownerId) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        if (
          !p.account.name.toLowerCase().includes(q) &&
          !(p.account.website?.toLowerCase().includes(q) ?? false) &&
          !(p.latestTrigger?.text.toLowerCase().includes(q) ?? false)
        ) {
          return false
        }
      }
      return true
    })
  }, [prospects, filters])

  const stageOrder = useMemo(() => buildStageOrderIndex(STAGE_META.map((m) => m.id)), [])

  const sorted = useMemo(
    () => sortProspects(filtered, sortBy, sortOrder, stageOrder),
    [filtered, sortBy, sortOrder, stageOrder],
  )

  const selected = selectedId ? prospects.find((p) => p.id === selectedId) ?? null : null

  return (
    <div className="flex flex-col max-lg:min-h-0 lg:min-h-0 lg:flex-1 lg:h-full">
      <header
        className={cn(
          PAGE_FRAME_CLASS,
          'flex shrink-0 flex-col bg-background pt-[var(--page-section-gap)] pb-[var(--page-section-gap)]',
          PAGE_SECTION_STACK,
        )}
      >
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-2xl font-semibold">{t('prospects.title')}</h1>
          <span className="text-sm text-muted">
            {t('prospects.count', { count: sorted.length })}
          </span>
        </div>

        <div className="flex min-w-0 items-center gap-2 lg:justify-between lg:gap-3">
          <SearchInput
            value={filters.search}
            onChange={(v) => setFilter('search', v)}
            placeholder={t('prospects.searchPlaceholder')}
            className="min-w-0 flex-1 overflow-hidden lg:w-[260px] lg:flex-none"
            inputClassName="h-8 lg:h-9"
          />
          <div className="flex shrink-0 items-center gap-1.5 lg:gap-2">
            <div className="lg:hidden">
              <ProspectToolbarMoreMenu
                prospects={prospects}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortByChange={setSortBy}
                onSortOrderChange={setSortOrder}
                groupBy={groupBy}
                onGroupByChange={setGroupBy}
                cardsPerRow={cardsPerRow}
                onCardsPerRowChange={setCardsPerRow}
              />
            </div>
            <IconButton
              icon={Plus}
              variant="primary"
              size="sm"
              label={t('prospects.addProspect')}
              onClick={() => setAddOpen(true)}
              className="shrink-0 lg:hidden"
            />
            <div className="hidden min-w-0 items-center gap-2 lg:flex">
              <ProspectFilters prospects={prospects} bordered />
              {viewMode === 'card' && (
                <ProspectCardDensity value={cardsPerRow} onChange={setCardsPerRow} bordered />
              )}
              {(viewMode === 'list' || viewMode === 'card') && (
                <ProspectGrouping groupBy={groupBy} onChange={setGroupBy} bordered />
              )}
              <ProspectSort
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortByChange={setSortBy}
                onSortOrderChange={setSortOrder}
                bordered
              />
              <ViewModeToggle mode={viewMode} onChange={setViewMode} />
              <StudioAccentAddButton type="button" onClick={() => setAddOpen(true)}>
                {t('prospects.addProspect')}
              </StudioAccentAddButton>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col max-lg:min-h-0 lg:min-h-0 lg:flex-1 lg:flex-row lg:overflow-hidden">
        <div
          className={cn(
            PAGE_FRAME_CLASS,
            'flex min-w-0 flex-col max-lg:pb-[var(--page-bottom-inset)] lg:min-h-0 lg:flex-1',
            viewMode === 'kanban' && 'lg:overflow-hidden',
          )}
        >
          {isLoading ? (
            <KanbanSkeleton />
          ) : isError ? (
            <div className="mx-auto mt-16 flex max-w-md flex-col items-center gap-3 text-center">
              <p className="text-sm font-medium text-foreground">
                {t('prospects.loadError')}
              </p>
              <p className="text-xs text-muted">{t('prospects.loadErrorHint')}</p>
              <Button size="sm" variant="secondary" onClick={() => void refetch()}>
                {t('common.retry')}
              </Button>
            </div>
          ) : viewMode === 'kanban' ? (
            <ProspectKanban
              prospects={sorted}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          ) : viewMode === 'list' ? (
            <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain">
              <ProspectListView
                prospects={sorted}
                selectedId={selectedId}
                onSelect={setSelectedId}
                groupBy={groupBy}
              />
            </div>
          ) : (
            <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:p-1 lg:[scrollbar-gutter:stable]">
              <ProspectCardView
                prospects={sorted}
                selectedId={selectedId}
                onSelect={setSelectedId}
                groupBy={groupBy}
                cardsPerRow={cardsPerRow}
              />
            </div>
          )}
        </div>

        {selected ? (
          <ProspectDetailPanel prospect={selected} onClose={() => setSelectedId(null)} />
        ) : null}
      </div>

      <AddProspectModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={() => {
          void refetch()
        }}
      />
    </div>
  )
}
