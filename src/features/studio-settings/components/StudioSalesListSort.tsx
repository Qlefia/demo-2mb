'use client'

import { useTranslation } from 'react-i18next'
import { ArrowUpDown } from 'lucide-react'
import { Popover } from '@/components/molecules'
import type { StudioSalesListSortBy, StudioSalesListTab } from '@/features/studio-settings/lib/studioSalesListTypes'
import { useStudioSalesListUiStore } from '@/stores/studioSalesListUiStore'

type StudioSalesListSortProps = {
  tab: StudioSalesListTab
}

const SORT_OPTIONS: Record<StudioSalesListTab, StudioSalesListSortBy[]> = {
  groups: ['manual', 'titleAsc', 'titleDesc'],
  services: ['manual', 'titleAsc', 'titleDesc'],
  works: ['manual', 'titleAsc', 'titleDesc'],
  reviews: ['manual', 'titleAsc', 'titleDesc', 'ratingDesc'],
  segments: ['manual', 'titleAsc', 'titleDesc'],
  tools: ['manual', 'titleAsc', 'titleDesc'],
  products: ['manual', 'titleAsc', 'titleDesc'],
  playbooks: ['manual', 'titleAsc', 'titleDesc'],
}

export function StudioSalesListSort({ tab }: StudioSalesListSortProps) {
  const { t } = useTranslation()
  const sortBy = useStudioSalesListUiStore((s) => s[tab].sortBy)
  const setSortBy = useStudioSalesListUiStore((s) => s.setSortBy)
  const hasActiveSort = sortBy !== 'manual'

  const trigger = (
    <span className="relative inline-block">
      <button
        type="button"
        className="shrink-0 rounded p-1.5 text-muted transition-colors hover:bg-muted/30 hover:text-foreground focus-visible:outline focus-visible:outline-offset-1 focus-visible:outline-ring"
        title={t('studioSettings.sales.listToolbar.sort.label')}
        aria-label={t('studioSettings.sales.listToolbar.sort.label')}
      >
        <ArrowUpDown size={14} strokeWidth={1.5} />
      </button>
      {hasActiveSort ? (
        <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
      ) : null}
    </span>
  )

  return (
    <Popover
      trigger={
        <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-sm border border-border">
          {trigger}
        </div>
      }
      className="min-w-48"
    >
      <div className="flex flex-col gap-2">
        <div className="crm-meta-label">{t('studioSettings.sales.listToolbar.sort.label')}</div>
        {SORT_OPTIONS[tab].map((value) => (
          <label key={value} className="flex cursor-pointer items-center gap-2 text-xs">
            <input
              type="radio"
              name={`studioSalesSort-${tab}`}
              checked={sortBy === value}
              onChange={() => setSortBy(tab, value)}
              className="accent-primary"
            />
            {t(`studioSettings.sales.listToolbar.sort.${value}`)}
          </label>
        ))}
      </div>
    </Popover>
  )
}
