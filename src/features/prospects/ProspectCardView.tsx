'use client'

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import type { Prospect } from './types'
import { ProspectCard } from './ProspectCard'
import type { ProspectGroupBy } from '@/lib/prospects/sortProspects'
import { groupProspects } from '@/lib/prospects/sortProspects'
import { STAGE_META_BY_ID } from './stageMeta'
import { formatTerritoryBadge } from './labels'
import type { ProspectStage } from '@/lib/db/schema/enums'

function groupTitle(t: (k: string) => string, groupBy: ProspectGroupBy, key: string, label: string): string {
  if (groupBy === 'stage') {
    const meta = STAGE_META_BY_ID[key as ProspectStage]
    return meta ? t(meta.labelKey) : key
  }
  if (groupBy === 'territory') return formatTerritoryBadge(key as Prospect['territory'])
  if (groupBy === 'owner') {
    return key === '__unassigned__' ? t('prospects.unassigned') : label
  }
  return key
}

interface ProspectCardViewProps {
  prospects: Prospect[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  groupBy: ProspectGroupBy
  cardsPerRow: 2 | 3 | 4
}

const colClass: Record<2 | 3 | 4, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4',
}

export function ProspectCardView({
  prospects,
  selectedId,
  onSelect,
  groupBy,
  cardsPerRow,
}: ProspectCardViewProps) {
  const { t } = useTranslation()

  const sections = useMemo(() => groupProspects(prospects, groupBy), [prospects, groupBy])

  if (prospects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-muted">{t('prospects.empty')}</p>
        <p className="mt-1 text-xs text-muted">{t('prospects.emptyDesc')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <section key={section.key} className="space-y-3">
          {groupBy !== 'none' && (
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
              {groupTitle(t, groupBy, section.key, section.label)}
              <span className="ml-2 tabular-nums text-muted/80">({section.items.length})</span>
            </h2>
          )}
          <div className={cn('grid grid-cols-1 items-stretch gap-3 overflow-visible', colClass[cardsPerRow])}>
            {section.items.map((p) => (
              <div key={p.id} className="h-full p-1">
                <ProspectCard
                  prospect={p}
                  selected={selectedId === p.id}
                  onSelect={(id) => onSelect(selectedId === id ? null : id)}
                  uniformHeight
                  className="h-full"
                />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
