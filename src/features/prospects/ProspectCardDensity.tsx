'use client'

import { useTranslation } from 'react-i18next'
import { LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Popover } from '@/components/molecules'
import {
  TOOLBAR_PANEL_RADIO_GROUP_CLASS,
  TOOLBAR_PANEL_RADIO_LABEL_CLASS,
} from '@/lib/layout/toolbarPanelStyles'

interface ProspectCardDensityProps {
  value: 2 | 3 | 4
  onChange: (value: 2 | 3 | 4) => void
  bordered?: boolean
}

export function ProspectCardDensityPanel({
  value,
  onChange,
}: Omit<ProspectCardDensityProps, 'bordered'>) {
  const { t } = useTranslation()

  return (
    <div className={TOOLBAR_PANEL_RADIO_GROUP_CLASS}>
      <div className="crm-meta-label">{t('prospects.cardDensity.label')}</div>
      {([2, 3, 4] as const).map((n) => (
        <label key={n} className={TOOLBAR_PANEL_RADIO_LABEL_CLASS}>
          <input
            type="radio"
            name="prospectCardsPerRow"
            checked={value === n}
            onChange={() => onChange(n)}
            className="accent-primary"
          />
          {t('prospects.cardDensity.perRow', { count: n })}
        </label>
      ))}
    </div>
  )
}

export function ProspectCardDensity({ value, onChange, bordered }: ProspectCardDensityProps) {
  const { t } = useTranslation()

  const trigger = (
    <button
      type="button"
      className={cn(
        'shrink-0 rounded p-1.5 text-muted transition-colors focus-visible:outline focus-visible:outline-offset-1 focus-visible:outline-ring',
        bordered ? 'hover:text-foreground' : 'hover:bg-muted/30 hover:text-foreground',
      )}
      title={t('prospects.cardDensity.label')}
      aria-label={t('prospects.cardDensity.label')}
    >
      <LayoutGrid size={14} strokeWidth={1.5} />
    </button>
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
      className="min-w-40"
    >
      <ProspectCardDensityPanel value={value} onChange={onChange} />
    </Popover>
  )
}
