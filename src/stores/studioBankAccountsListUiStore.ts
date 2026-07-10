import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type StudioBankAccountsListViewMode = 'list' | 'card'

export type StudioBankAccountsListFilter = 'all' | 'default'

type StudioBankAccountsListUiState = {
  search: string
  viewMode: StudioBankAccountsListViewMode
  filter: StudioBankAccountsListFilter
  setSearch: (search: string) => void
  setViewMode: (viewMode: StudioBankAccountsListViewMode) => void
  setFilter: (filter: StudioBankAccountsListFilter) => void
  resetFilters: () => void
}

export const useStudioBankAccountsListUiStore = create<StudioBankAccountsListUiState>()(
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
    {
      name: '2mb-studio-bank-accounts-list-ui',
      partialize: (s) => ({ viewMode: s.viewMode }),
    },
  ),
)
