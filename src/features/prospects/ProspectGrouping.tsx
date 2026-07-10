'use client'

import { useTranslation } from 'react-i18next'
import { Layers } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Popover } from '@/components/molecules'
import {
  TOOLBAR_PANEL_RADIO_GROUP_CLASS,
  TOOLBAR_PANEL_RADIO_LABEL_CLASS,
} from '@/lib/layout/toolbarPanelStyles'
import type { ProspectGroupBy } from '@/lib/prospects/sortProspects'

interface ProspectGroupingProps {
  groupBy: ProspectGroupBy
  onChange: (groupBy: ProspectGroupBy) => void
  bordered?: boolean
}

export function ProspectGroupingPanel({
  groupBy,
  onChange,
}: Omit<ProspectGroupingProps, 'bordered'>) {
  const { t } = useTranslation()

  return (
    <div className={TOOLBAR_PANEL_RADIO_GROUP_CLASS}>
      <div className="crm-meta-label">{t('prospects.grouping.label')}</div>
      <label className={TOOLBAR_PANEL_RADIO_LABEL_CLASS}>
        <input
          type="radio"
          name="prospectGroupBy"
          checked={groupBy === 'none'}
          onChange={() => onChange('none')}
          className="accent-primary"
        />
        {t('prospects.grouping.none')}
      </label>
      <label className={TOOLBAR_PANEL_RADIO_LABEL_CLASS}>
        <input
          type="radio"
          name="prospectGroupBy"
          checked={groupBy === 'stage'}
          onChange={() => onChange('stage')}
          className="accent-primary"
        />
        {t('prospects.grouping.stage')}
      </label>
      <label className={TOOLBAR_PANEL_RADIO_LABEL_CLASS}>
        <input
          type="radio"
          name="prospectGroupBy"
          checked={groupBy === 'territory'}
          onChange={() => onChange('territory')}
          className="accent-primary"
        />
        {t('prospects.grouping.territory')}
      </label>
      <label className={TOOLBAR_PANEL_RADIO_LABEL_CLASS}>
        <input
          type="radio"
          name="prospectGroupBy"
          checked={groupBy === 'owner'}
          onChange={() => onChange('owner')}
          className="accent-primary"
        />
        {t('prospects.grouping.owner')}
      </label>
    </div>
  )
}

export function ProspectGrouping({ groupBy, onChange, bordered }: ProspectGroupingProps) {
  const { t } = useTranslation()
  const hasActive = groupBy !== 'none'

  const trigger = (
    <span className="relative inline-block">
      <button
        type="button"
        className={cn(
          'shrink-0 rounded p-1.5 text-muted transition-colors focus-visible:outline focus-visible:outline-offset-1 focus-visible:outline-ring',
          bordered ? 'hover:text-foreground' : 'hover:bg-muted/30 hover:text-foreground',
        )}
        title={t('prospects.grouping.label')}
        aria-label={t('prospects.grouping.label')}
      >
        <Layers size={14} strokeWidth={1.5} />
      </button>
      {hasActive && (
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
      <ProspectGroupingPanel groupBy={groupBy} onChange={onChange} />
    </Popover>
  )
}
