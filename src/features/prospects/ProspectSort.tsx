'use client'

import { useTranslation } from 'react-i18next'
import { ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import {
  TOOLBAR_PANEL_RADIO_GROUP_CLASS,
  TOOLBAR_PANEL_RADIO_LABEL_CLASS,
} from '@/lib/layout/toolbarPanelStyles'
import { Popover } from '@/components/molecules'
import type { ProspectSortField, ProspectSortOrder } from '@/lib/prospects/sortProspects'

interface ProspectSortProps {
  sortBy: ProspectSortField
  sortOrder: ProspectSortOrder
  onSortByChange: (field: ProspectSortField) => void
  onSortOrderChange: (order: ProspectSortOrder) => void
  bordered?: boolean
}

const DEFAULT_SORT: ProspectSortField = 'updated'
const DEFAULT_ORDER: ProspectSortOrder = 'desc'

export function hasActiveProspectSort(sortBy: ProspectSortField, sortOrder: ProspectSortOrder) {
  return sortBy !== DEFAULT_SORT || sortOrder !== DEFAULT_ORDER
}

export function ProspectSortPanel({
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
}: Omit<ProspectSortProps, 'bordered'>) {
  const { t } = useTranslation()

  const fields: { value: ProspectSortField; i18nKey: string }[] = [
    { value: 'account', i18nKey: 'prospects.sort.byAccount' },
    { value: 'updated', i18nKey: 'prospects.sort.byUpdated' },
    { value: 'priority', i18nKey: 'prospects.sort.byPriority' },
    { value: 'stage', i18nKey: 'prospects.sort.byStage' },
  ]

  return (
    <div className="flex flex-col gap-2">
      <div className="crm-meta-label">{t('prospects.sort.label')}</div>
      <div className={TOOLBAR_PANEL_RADIO_GROUP_CLASS}>
        {fields.map(({ value, i18nKey }) => (
          <label key={value} className={TOOLBAR_PANEL_RADIO_LABEL_CLASS}>
            <input
              type="radio"
              name="prospectSortBy"
              checked={sortBy === value}
              onChange={() => onSortByChange(value)}
              className="accent-primary"
            />
            {t(i18nKey)}
          </label>
        ))}
      </div>
      <div className={cn('border-t border-border pt-2', TOOLBAR_PANEL_RADIO_GROUP_CLASS)}>
        <div className="crm-meta-label">{t('prospects.sort.order')}</div>
        <label className={TOOLBAR_PANEL_RADIO_LABEL_CLASS}>
          <input
            type="radio"
            name="prospectSortOrder"
            checked={sortOrder === 'asc'}
            onChange={() => onSortOrderChange('asc')}
            className="accent-primary"
          />
          {t('prospects.sort.asc')}
        </label>
        <label className={TOOLBAR_PANEL_RADIO_LABEL_CLASS}>
          <input
            type="radio"
            name="prospectSortOrder"
            checked={sortOrder === 'desc'}
            onChange={() => onSortOrderChange('desc')}
            className="accent-primary"
          />
          {t('prospects.sort.desc')}
        </label>
      </div>
    </div>
  )
}

export function ProspectSort({
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
  bordered,
}: ProspectSortProps) {
  const { t } = useTranslation()
  const hasActiveSort = hasActiveProspectSort(sortBy, sortOrder)

  const trigger = (
    <span className="relative inline-block">
      <button
        type="button"
        className={cn(
          'shrink-0 rounded p-1.5 text-muted transition-colors focus-visible:outline focus-visible:outline-offset-1 focus-visible:outline-ring',
          bordered ? 'hover:text-foreground' : 'hover:bg-muted/30 hover:text-foreground',
        )}
        title={t('prospects.sort.label')}
        aria-label={t('prospects.sort.label')}
      >
        <ArrowUpDown size={14} strokeWidth={1.5} />
      </button>
      {hasActiveSort && (
        <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
      )}
    </span>
  )

  return (
    <Popover
      trigger={
        bordered ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-border">
            {trigger}
          </div>
        ) : (
          trigger
        )
      }
      className="min-w-48"
    >
      <ProspectSortPanel
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortByChange={onSortByChange}
        onSortOrderChange={onSortOrderChange}
      />
    </Popover>
  )
}
