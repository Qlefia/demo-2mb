import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  StudioSalesListFilter,
  StudioSalesListSortBy,
  StudioSalesListTabUi,
  StudioSalesListViewMode,
} from '@/features/studio-settings/lib/studioSalesListTypes'
import type { StudioSalesListTab } from '@/lib/studio/studioSalesPaths'

function defaultTabUi(): StudioSalesListTabUi {
  return {
    search: '',
    viewMode: 'list',
    sortBy: 'manual',
    filter: 'all',
  }
}

type StudioSalesListUiState = {
  groups: StudioSalesListTabUi
  services: StudioSalesListTabUi
  works: StudioSalesListTabUi
  reviews: StudioSalesListTabUi
  segments: StudioSalesListTabUi
  tools: StudioSalesListTabUi
  products: StudioSalesListTabUi
  playbooks: StudioSalesListTabUi
  setSearch: (tab: StudioSalesListTab, search: string) => void
  setViewMode: (tab: StudioSalesListTab, viewMode: StudioSalesListViewMode) => void
  setSortBy: (tab: StudioSalesListTab, sortBy: StudioSalesListSortBy) => void
  setFilter: (tab: StudioSalesListTab, filter: StudioSalesListFilter) => void
  resetFilters: (tab: StudioSalesListTab) => void
}

function patchTab(
  tab: StudioSalesListTab,
  patch: Partial<StudioSalesListTabUi>,
): (state: StudioSalesListUiState) => Partial<StudioSalesListUiState> {
  return (state) => ({ [tab]: { ...state[tab], ...patch } })
}

export const useStudioSalesListUiStore = create<StudioSalesListUiState>()(
  persist(
    (set) => ({
      groups: defaultTabUi(),
      services: defaultTabUi(),
      works: defaultTabUi(),
      reviews: defaultTabUi(),
      segments: defaultTabUi(),
      tools: defaultTabUi(),
      products: defaultTabUi(),
      playbooks: defaultTabUi(),
      setSearch: (tab, search) => set(patchTab(tab, { search })),
      setViewMode: (tab, viewMode) => set(patchTab(tab, { viewMode })),
      setSortBy: (tab, sortBy) => set(patchTab(tab, { sortBy })),
      setFilter: (tab, filter) => set(patchTab(tab, { filter })),
      resetFilters: (tab) =>
        set(patchTab(tab, { search: '', filter: 'all', sortBy: 'manual' })),
    }),
    { name: '2mb-studio-sales-list-ui' },
  ),
)
