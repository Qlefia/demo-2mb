'use client'

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ListFilter } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Popover } from '@/components/molecules'
import { useProspectStore } from '@/stores/prospectStore'
import { TERRITORIES, type Territory } from '@/lib/db/schema/enums'
import { TOOLBAR_PANEL_SELECT_CLASS } from '@/lib/layout/toolbarPanelStyles'
import type { Prospect } from './types'
import { STAGE_META } from './stageMeta'
import { formatTerritoryBadge } from './labels'

interface ProspectFiltersProps {
  prospects: Prospect[]
  bordered?: boolean
}

const SELECT_CLASS = TOOLBAR_PANEL_SELECT_CLASS

export function useProspectFilterOwnerOptions(prospects: Prospect[]) {
  return useMemo(() => {
    const m = new Map<string, string>()
    for (const p of prospects) {
      if (!p.ownerId) continue
      if (!m.has(p.ownerId)) m.set(p.ownerId, p.ownerLabel ?? p.ownerId)
    }
    return [...m.entries()].sort((a, b) =>
      a[1].localeCompare(b[1], undefined, { sensitivity: 'base' }),
    )
  }, [prospects])
}

export function hasActiveProspectFilters(filters: {
  territory: string
  stage: string
  ownerId: string
}) {
  return Boolean(filters.territory) || Boolean(filters.stage) || Boolean(filters.ownerId)
}

export function ProspectFiltersPanel({ prospects }: { prospects: Prospect[] }) {
  const { t } = useTranslation()
  const filters = useProspectStore((s) => s.filters)
  const setFilter = useProspectStore((s) => s.setFilter)
  const reset = useProspectStore((s) => s.resetFilters)
  const ownerOptions = useProspectFilterOwnerOptions(prospects)
  const hasActive = hasActiveProspectFilters(filters)

  return (
    <div className="flex flex-col gap-3">
      <div className="crm-meta-label">{t('prospects.filters.label')}</div>

      <label className="flex flex-col gap-1 text-xs text-muted">
        {t('prospects.filterTerritory')}
        <select
          value={filters.territory}
          onChange={(e) => setFilter('territory', e.target.value as Territory | '')}
          className={SELECT_CLASS}
        >
          <option value="">{t('prospects.allTerritories')}</option>
          {TERRITORIES.map((territory) => (
            <option key={territory} value={territory}>
              {formatTerritoryBadge(territory)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-muted">
        {t('prospects.filterStage')}
        <select
          value={filters.stage}
          onChange={(e) => setFilter('stage', e.target.value as typeof filters.stage)}
          className={SELECT_CLASS}
        >
          <option value="">{t('prospects.allStages')}</option>
          {STAGE_META.map((meta) => (
            <option key={meta.id} value={meta.id}>
              {t(meta.labelKey)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-muted">
        {t('prospects.filterOwner')}
        <select
          value={filters.ownerId}
          onChange={(e) => setFilter('ownerId', e.target.value)}
          className={SELECT_CLASS}
        >
          <option value="">{t('prospects.allOwners')}</option>
          {ownerOptions.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </label>

      {hasActive ? (
        <button
          type="button"
          onClick={reset}
          className="text-left text-xs text-muted underline-offset-2 hover:text-foreground hover:underline"
        >
          {t('prospects.filters.reset')}
        </button>
      ) : null}
    </div>
  )
}

export function ProspectFilters({ prospects, bordered }: ProspectFiltersProps) {
  const { t } = useTranslation()
  const filters = useProspectStore((s) => s.filters)
  const hasActive = hasActiveProspectFilters(filters)

  const trigger = (
    <span className="relative inline-block">
      <button
        type="button"
        className={cn(
          'shrink-0 rounded p-1.5 text-muted transition-colors focus-visible:outline focus-visible:outline-offset-1 focus-visible:outline-ring',
          bordered ? 'hover:text-foreground' : 'hover:bg-muted/30 hover:text-foreground',
        )}
        title={t('prospects.filters.label')}
        aria-label={t('prospects.filters.label')}
      >
        <ListFilter size={14} strokeWidth={1.5} />
      </button>
      {hasActive ? (
        <span
          className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-primary"
          aria-hidden
        />
      ) : null}
    </span>
  )

  return (
    <Popover
      trigger={
        bordered ? (
          <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-sm border border-border">
            {trigger}
          </div>
        ) : (
          trigger
        )
      }
      className="min-w-56"
    >
      <ProspectFiltersPanel prospects={prospects} />
    </Popover>
  )
}
