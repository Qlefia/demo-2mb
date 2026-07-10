'use client'

import { useMemo } from 'react'
import {
  studioSalesListFilterBySearch,
  studioSalesListSortIds,
} from '@/features/studio-settings/lib/studioSalesListOps'
import type {
  StudioSalesListFilter,
  StudioSalesListSortBy,
  StudioSalesListTab,
  StudioSalesListViewMode,
} from '@/features/studio-settings/lib/studioSalesListTypes'
import { useStudioSalesListUiStore } from '@/stores/studioSalesListUiStore'

export type UseStudioSalesListIdsParams = {
  tab: StudioSalesListTab
  sourceIds: readonly string[]
  matchesFilter: (id: string, filter: StudioSalesListFilter) => boolean
  getSearchText: (id: string) => string
  getTitle: (id: string) => string
  getRating?: (id: string) => number | null
}

export type StudioSalesListIdsResult = {
  ids: string[]
  viewMode: StudioSalesListViewMode
  sortBy: StudioSalesListSortBy
  filter: StudioSalesListFilter
  search: string
  isManualOrder: boolean
  hasActiveFilters: boolean
  noResults: boolean
}

export function useStudioSalesListIds({
  tab,
  sourceIds,
  matchesFilter,
  getSearchText,
  getTitle,
  getRating,
}: UseStudioSalesListIdsParams): StudioSalesListIdsResult {
  const search = useStudioSalesListUiStore((s) => s[tab].search)
  const viewMode = useStudioSalesListUiStore((s) => s[tab].viewMode)
  const sortBy = useStudioSalesListUiStore((s) => s[tab].sortBy)
  const filter = useStudioSalesListUiStore((s) => s[tab].filter)

  return useMemo(() => {
    const filtered = sourceIds.filter((id) => matchesFilter(id, filter))
    const searched = studioSalesListFilterBySearch(filtered, search, getSearchText)
    const ids = studioSalesListSortIds(searched, sortBy, getTitle, getRating)
    const q = search.trim()
    const hasActiveFilters = q.length > 0 || filter !== 'all' || sortBy !== 'manual'
    const isManualOrder = sortBy === 'manual' && !q && filter === 'all'
    const noResults = sourceIds.length > 0 && ids.length === 0
    return {
      ids,
      viewMode,
      sortBy,
      filter,
      search,
      isManualOrder,
      hasActiveFilters,
      noResults,
    }
  }, [
    sourceIds,
    matchesFilter,
    getSearchText,
    getTitle,
    getRating,
    search,
    viewMode,
    sortBy,
    filter,
  ])
}
