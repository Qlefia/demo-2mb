'use client'

import { Ellipsis } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Popover, ViewModeToggle } from '@/components/molecules'
import { TOOLBAR_ICON_SQUARE_CLASS } from '@/lib/layout/toolbarPanelStyles'
import { cn } from '@/lib/cn'
import { useProspectStore } from '@/stores/prospectStore'
import type { ProspectGroupBy, ProspectSortField, ProspectSortOrder } from '@/lib/prospects/sortProspects'
import type { Prospect } from './types'
import { ProspectCardDensityPanel } from './ProspectCardDensity'
import { ProspectFiltersPanel, hasActiveProspectFilters } from './ProspectFilters'
import { ProspectGroupingPanel } from './ProspectGrouping'
import { ProspectSortPanel, hasActiveProspectSort } from './ProspectSort'

interface ProspectToolbarMoreMenuProps {
  prospects: Prospect[]
  viewMode: 'list' | 'card' | 'kanban'
  onViewModeChange: (mode: 'list' | 'card' | 'kanban') => void
  sortBy: ProspectSortField
  sortOrder: ProspectSortOrder
  onSortByChange: (field: ProspectSortField) => void
  onSortOrderChange: (order: ProspectSortOrder) => void
  groupBy: ProspectGroupBy
  onGroupByChange: (groupBy: ProspectGroupBy) => void
  cardsPerRow: 2 | 3 | 4
  onCardsPerRowChange: (value: 2 | 3 | 4) => void
}

export function ProspectToolbarMoreMenu({
  prospects,
  viewMode,
  onViewModeChange,
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
  groupBy,
  onGroupByChange,
  cardsPerRow,
  onCardsPerRowChange,
}: ProspectToolbarMoreMenuProps) {
  const { t } = useTranslation()
  const filters = useProspectStore((s) => s.filters)

  const hasActive =
    hasActiveProspectFilters(filters) ||
    hasActiveProspectSort(sortBy, sortOrder) ||
    groupBy !== 'none'

  return (
    <Popover
      anchor="bottom end"
      className="min-w-72 max-w-[min(100vw-2rem,20rem)]"
      trigger={
        <button
          type="button"
          className={cn(
            TOOLBAR_ICON_SQUARE_CLASS,
            'relative text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
          )}
          aria-label={t('prospects.toolbar.more')}
        >
          <Ellipsis size={16} strokeWidth={1.5} aria-hidden />
          {hasActive ? (
            <span
              className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-primary"
              aria-hidden
            />
          ) : null}
        </button>
      }
    >
      <div className="flex max-h-[min(70vh,24rem)] flex-col gap-4 overflow-y-auto overscroll-contain">
        <section className="flex flex-col gap-2">
          <div className="crm-meta-label">{t('prospects.toolbar.view')}</div>
          <ViewModeToggle mode={viewMode} onChange={onViewModeChange} stretch />
        </section>

        <ProspectFiltersPanel prospects={prospects} />

        <ProspectSortPanel
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortByChange={onSortByChange}
          onSortOrderChange={onSortOrderChange}
        />

        {viewMode === 'list' || viewMode === 'card' ? (
          <ProspectGroupingPanel groupBy={groupBy} onChange={onGroupByChange} />
        ) : null}

        {viewMode === 'card' ? (
          <ProspectCardDensityPanel value={cardsPerRow} onChange={onCardsPerRowChange} />
        ) : null}
      </div>
    </Popover>
  )
}
