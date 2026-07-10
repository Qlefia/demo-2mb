'use client'

import { useTranslation } from 'react-i18next'
import { ListFilter } from 'lucide-react'
import { Popover } from '@/components/molecules'
import type {
  StudioSalesListFilter,
  StudioSalesListTab,
} from '@/features/studio-settings/lib/studioSalesListTypes'
import { useStudioSalesListUiStore } from '@/stores/studioSalesListUiStore'

type StudioSalesListFiltersProps = {
  tab: StudioSalesListTab
}

const FILTER_OPTIONS: Record<StudioSalesListTab, readonly string[]> = {
  groups: ['all', 'hasServices', 'empty'],
  services: ['all', 'inGroup', 'ungrouped'],
  works: ['all', 'featured', 'draft', 'in_review', 'published', 'unpublished'],
  reviews: ['all', 'rated', 'unrated'],
  segments: ['all'],
  tools: [
    'all',
    'featured',
    'render_engine',
    'modeling_3d',
    'cad_bim',
    'compositing',
    'post_production',
    'motion',
    'texturing',
    'plugin',
    'other',
  ],
  products: ['all', 'featured'],
  playbooks: ['all', 'first_touch', 'follow_up', 'voicemail', 'objection', 'discovery_call', 'de', 'en'],
}

export function StudioSalesListFilters({ tab }: StudioSalesListFiltersProps) {
  const { t } = useTranslation()
  const filter = useStudioSalesListUiStore((s) => s[tab].filter)
  const setFilter = useStudioSalesListUiStore((s) => s.setFilter)
  const resetFilters = useStudioSalesListUiStore((s) => s.resetFilters)
  const hasActiveFilter = filter !== 'all'

  const trigger = (
    <span className="relative inline-block">
      <button
        type="button"
        className="shrink-0 rounded p-1.5 text-muted transition-colors hover:bg-muted/30 hover:text-foreground focus-visible:outline focus-visible:outline-offset-1 focus-visible:outline-ring"
        title={t('studioSettings.sales.listToolbar.filter.label')}
        aria-label={t('studioSettings.sales.listToolbar.filter.label')}
      >
        <ListFilter size={14} strokeWidth={1.5} />
      </button>
      {hasActiveFilter ? (
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
      className="min-w-52"
    >
      <div className="flex flex-col gap-3">
        <div className="crm-meta-label">{t('studioSettings.sales.listToolbar.filter.label')}</div>
        <div className="flex flex-col gap-2">
          {FILTER_OPTIONS[tab].map((value) => (
            <label key={value} className="flex cursor-pointer items-center gap-2 text-xs">
              <input
                type="radio"
                name={`studioSalesFilter-${tab}`}
                checked={filter === value}
                onChange={() => setFilter(tab, value as StudioSalesListFilter)}
                className="accent-primary"
              />
              {t(`studioSettings.sales.listToolbar.filter.${tab}.${value}`)}
            </label>
          ))}
        </div>
        {hasActiveFilter ? (
          <button
            type="button"
            onClick={() => resetFilters(tab)}
            className="text-left text-xs text-muted underline-offset-2 hover:text-foreground hover:underline"
          >
            {t('studioSettings.sales.listToolbar.filter.reset')}
          </button>
        ) : null}
      </div>
    </Popover>
  )
}
