import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { StudioDocumentTemplateKind } from '@/stores/studioProfileTypes'

export type StudioTemplatesListViewMode = 'list' | 'card'

/** Per-tab filter on top of the kind already pre-selected by the calling tab. */
export type StudioTemplatesListFilter = 'all' | 'default' | 'custom'

type StudioTemplatesListUiState = {
  search: string
  viewMode: StudioTemplatesListViewMode
  filter: StudioTemplatesListFilter
  /** Last edited template kind — used as a fallback for back-link from detail page when query is absent. */
  lastKind: StudioDocumentTemplateKind
  setSearch: (search: string) => void
  setViewMode: (viewMode: StudioTemplatesListViewMode) => void
  setFilter: (filter: StudioTemplatesListFilter) => void
  setLastKind: (kind: StudioDocumentTemplateKind) => void
  resetFilters: () => void
}

export const useStudioTemplatesListUiStore = create<StudioTemplatesListUiState>()(
  persist(
    (set) => ({
      search: '',
      viewMode: 'list',
      filter: 'all',
      lastKind: 'offer',
      setSearch: (search) => set({ search }),
      setViewMode: (viewMode) => set({ viewMode }),
      setFilter: (filter) => set({ filter }),
      setLastKind: (lastKind) => set({ lastKind }),
      resetFilters: () => set({ search: '', filter: 'all' }),
    }),
    {
      name: '2mb-studio-templates-list-ui',
      partialize: (s) => ({ viewMode: s.viewMode, lastKind: s.lastKind }),
    },
  ),
)
