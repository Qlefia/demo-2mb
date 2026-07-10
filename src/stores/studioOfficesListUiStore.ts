import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type StudioOfficesListViewMode = 'list' | 'card'

export type StudioOfficesListFilter = 'all' | 'physical' | 'virtual' | 'legal_registered'

type StudioOfficesListUiState = {
  search: string
  viewMode: StudioOfficesListViewMode
  filter: StudioOfficesListFilter
  setSearch: (search: string) => void
  setViewMode: (viewMode: StudioOfficesListViewMode) => void
  setFilter: (filter: StudioOfficesListFilter) => void
  resetFilters: () => void
}

export const useStudioOfficesListUiStore = create<StudioOfficesListUiState>()(
  persist(
    (set) => ({
      search: '',
      viewMode: 'list',
      filter: 'all',
      setSearch: (search) => set({ search }),
      setViewMode: (viewMode) => set({ viewMode }),
      setFilter: (filter) => set({ filter }),
      resetFilters: () => set({ search: '', filter: 'all' }),
    }),
    { name: '2mb-studio-offices-list-ui' },
  ),
)
