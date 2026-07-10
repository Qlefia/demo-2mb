'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { ListFilter } from 'lucide-react'
import { SearchInput, ViewModeToggle, Popover } from '@/components/molecules'
import { StudioAccentAddButton } from '@/features/studio-settings/components/StudioAccentAddButton'
import { useStudioOfficesListUiStore } from '@/stores/studioOfficesListUiStore'
import type { StudioOfficesListFilter } from '@/stores/studioOfficesListUiStore'
import { useStudioProfileStore } from '@/stores/studioProfileStore'
import { studioOfficeDetailPath } from '@/lib/studio/studioOfficesPaths'

const FILTER_OPTIONS: StudioOfficesListFilter[] = [
  'all',
  'physical',
  'virtual',
  'legal_registered',
]

export function StudioOfficesListToolbar() {
  const { t } = useTranslation()
  const router = useRouter()
  const search = useStudioOfficesListUiStore((s) => s.search)
  const viewMode = useStudioOfficesListUiStore((s) => s.viewMode)
  const filter = useStudioOfficesListUiStore((s) => s.filter)
  const setSearch = useStudioOfficesListUiStore((s) => s.setSearch)
  const setViewMode = useStudioOfficesListUiStore((s) => s.setViewMode)
  const setFilter = useStudioOfficesListUiStore((s) => s.setFilter)
  const resetFilters = useStudioOfficesListUiStore((s) => s.resetFilters)
  const addOffice = useStudioProfileStore((s) => s.addOffice)

  const hasActiveFilter = filter !== 'all'

  const handleAdd = useCallback(() => {
    const id = addOffice()
    router.push(studioOfficeDetailPath(id))
  }, [addOffice, router])

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder={t('studioSettings.general.offices.toolbar.searchPlaceholder')}
        className="w-full sm:w-[260px]"
      />
      <div className="flex min-w-0 shrink-0 flex-nowrap items-center gap-2 overflow-x-auto overscroll-x-contain">
        <StudioAccentAddButton type="button" onClick={handleAdd}>
          {t('studioSettings.general.offices.add')}
        </StudioAccentAddButton>
        <Popover
          trigger={
            <div className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-sm border border-border">
              <ListFilter size={14} strokeWidth={1.5} className="text-muted" aria-hidden />
              {hasActiveFilter ? (
                <span
                  className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-primary"
                  aria-hidden
                />
              ) : null}
            </div>
          }
          className="min-w-52"
        >
          <div className="flex flex-col gap-3">
            <div className="crm-meta-label">
              {t('studioSettings.general.offices.toolbar.filterLabel')}
            </div>
            <div className="flex flex-col gap-2">
              {FILTER_OPTIONS.map((value) => (
                <label key={value} className="flex cursor-pointer items-center gap-2 text-xs">
                  <input
                    type="radio"
                    name="studioOfficesFilter"
                    checked={filter === value}
                    onChange={() => setFilter(value)}
                    className="accent-primary"
                  />
                  {t(`studioSettings.general.offices.toolbar.filter.${value}`)}
                </label>
              ))}
            </div>
            {hasActiveFilter ? (
              <button
                type="button"
                onClick={resetFilters}
                className="text-left text-xs text-muted underline-offset-2 hover:text-foreground hover:underline"
              >
                {t('studioSettings.general.offices.toolbar.resetFilters')}
              </button>
            ) : null}
          </div>
        </Popover>
        <ViewModeToggle
          mode={viewMode}
          onChange={(mode) => {
            if (mode === 'list' || mode === 'card') setViewMode(mode)
          }}
          options={['list', 'card']}
        />
      </div>
    </div>
  )
}
