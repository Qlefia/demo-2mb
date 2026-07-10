'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { ListFilter } from 'lucide-react'
import { SearchInput, ViewModeToggle, Popover } from '@/components/molecules'
import { StudioAccentAddButton } from '@/features/studio-settings/components/StudioAccentAddButton'
import { useStudioBankAccountsListUiStore } from '@/stores/studioBankAccountsListUiStore'
import type { StudioBankAccountsListFilter } from '@/stores/studioBankAccountsListUiStore'
import { useStudioProfileStore } from '@/stores/studioProfileStore'
import { studioBankAccountDetailPath } from '@/lib/studio/studioBankAccountsPaths'
import { STUDIO_BANK_ACCOUNTS_MAX } from '@/features/studio-settings/constants'

const FILTER_OPTIONS: StudioBankAccountsListFilter[] = ['all', 'default']

export function StudioBankAccountsListToolbar() {
  const { t } = useTranslation()
  const router = useRouter()
  const search = useStudioBankAccountsListUiStore((s) => s.search)
  const viewMode = useStudioBankAccountsListUiStore((s) => s.viewMode)
  const filter = useStudioBankAccountsListUiStore((s) => s.filter)
  const setSearch = useStudioBankAccountsListUiStore((s) => s.setSearch)
  const setViewMode = useStudioBankAccountsListUiStore((s) => s.setViewMode)
  const setFilter = useStudioBankAccountsListUiStore((s) => s.setFilter)
  const resetFilters = useStudioBankAccountsListUiStore((s) => s.resetFilters)
  const addBankAccount = useStudioProfileStore((s) => s.addBankAccount)
  const bankCount = useStudioProfileStore((s) => s.general.bankAccounts.length)

  const hasActiveFilter = filter !== 'all'
  const canAdd = bankCount < STUDIO_BANK_ACCOUNTS_MAX

  const handleAdd = useCallback(() => {
    if (!canAdd) return
    const id = addBankAccount()
    router.push(studioBankAccountDetailPath(id))
  }, [addBankAccount, canAdd, router])

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder={t('studioSettings.invoicing.bankAccountsToolbar.searchPlaceholder')}
        className="w-full sm:w-[260px]"
      />
      <div className="flex min-w-0 shrink-0 flex-nowrap items-center gap-2 overflow-x-auto overscroll-x-contain">
        <StudioAccentAddButton type="button" onClick={handleAdd} disabled={!canAdd}>
          {t('studioSettings.invoicing.addBankAccount')}
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
              {t('studioSettings.invoicing.bankAccountsToolbar.filterLabel')}
            </div>
            <div className="flex flex-col gap-2">
              {FILTER_OPTIONS.map((value) => (
                <label key={value} className="flex cursor-pointer items-center gap-2 text-xs">
                  <input
                    type="radio"
                    name="studioBankAccountsFilter"
                    checked={filter === value}
                    onChange={() => setFilter(value)}
                    className="accent-primary"
                  />
                  {t(`studioSettings.invoicing.bankAccountsToolbar.filter.${value}`)}
                </label>
              ))}
            </div>
            {hasActiveFilter ? (
              <button
                type="button"
                onClick={resetFilters}
                className="text-left text-xs text-muted underline-offset-2 hover:text-foreground hover:underline"
              >
                {t('studioSettings.invoicing.bankAccountsToolbar.resetFilters')}
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
