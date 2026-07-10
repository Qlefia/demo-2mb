import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProspectStage, Territory } from '@/features/prospects/types'
import type {
  ProspectGroupBy,
  ProspectSortField,
  ProspectSortOrder,
} from '@/lib/prospects/sortProspects'

export type ProspectViewMode = 'kanban' | 'list' | 'card'

export interface ProspectFiltersState {
  search: string
  territory: Territory | ''
  stage: ProspectStage | ''
  ownerId: string | ''
}

/**
 * UI-only Zustand store for the prospects screen.
 *
 * Server data (the list of prospects, individual prospect, dossier status,
 * owner labels) lives in TanStack Query — see
 * `src/features/prospects/api/useProspectsQuery.ts` and
 * `useProspectMutations.ts`. We intentionally do NOT mirror that data here
 * to avoid the 2026-05-21 incident pattern where a Zustand `persist` snapshot
 * was treated as source-of-truth and silently overwrote remote rows.
 *
 * The persist middleware only saves UI preferences: view mode, sort, grouping,
 * card density. Filters reset every reload (transient by design).
 */
interface ProspectState {
  selectedProspectId: string | null
  viewMode: ProspectViewMode
  sortBy: ProspectSortField
  sortOrder: ProspectSortOrder
  groupBy: ProspectGroupBy
  cardsPerRow: 2 | 3 | 4
  filters: ProspectFiltersState

  setSelectedProspectId: (id: string | null) => void
  setViewMode: (mode: ProspectViewMode) => void
  setSortBy: (field: ProspectSortField) => void
  setSortOrder: (order: ProspectSortOrder) => void
  setGroupBy: (group: ProspectGroupBy) => void
  setCardsPerRow: (n: 2 | 3 | 4) => void
  setFilter: <K extends keyof ProspectFiltersState>(key: K, value: ProspectFiltersState[K]) => void
  resetFilters: () => void
}

const EMPTY_FILTERS: ProspectFiltersState = {
  search: '',
  territory: '',
  stage: '',
  ownerId: '',
}

export const useProspectStore = create<ProspectState>()(
  persist(
    (set) => ({
      selectedProspectId: null,
      viewMode: 'kanban',
      sortBy: 'updated',
      sortOrder: 'desc',
      groupBy: 'none',
      cardsPerRow: 3,
      filters: EMPTY_FILTERS,

      setSelectedProspectId: (id) => set({ selectedProspectId: id }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setSortBy: (sortBy) => set({ sortBy }),
      setSortOrder: (sortOrder) => set({ sortOrder }),
      setGroupBy: (groupBy) => set({ groupBy }),
      setCardsPerRow: (cardsPerRow) => set({ cardsPerRow }),
      setFilter: (key, value) =>
        set((state) => ({ filters: { ...state.filters, [key]: value } })),
      resetFilters: () => set({ filters: EMPTY_FILTERS }),
    }),
    {
      name: '2mb-crm-prospects-ui',
      /**
       * Persist version. v4 (2026-05-22) — removed the `prospects` array and
       * data mutations (`setProspects`, `upsertProspect`, `patchProspectStage`,
       * `removeProspect`) which moved to TanStack Query
       * (`useProspectsQuery` + `useProspectMutations`). Older clients (v0..v3)
       * may have stale `prospects` in localStorage — the partialize call below
       * drops anything that isn't a UI preference, so the migration is a no-op
       * pass-through.
       */
      version: 4,
      migrate: (persistedState) => persistedState as ProspectState,
      partialize: (state) => ({
        viewMode: state.viewMode,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        groupBy: state.groupBy,
        cardsPerRow: state.cardsPerRow,
      }),
    },
  ),
)
