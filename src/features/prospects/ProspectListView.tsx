'use client'

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/intl/datetime'
import type { Prospect } from './types'
import { STAGE_META_BY_ID } from './stageMeta'
import { formatTerritoryBadge } from './labels'
import type { ProspectGroupBy } from '@/lib/prospects/sortProspects'
import { groupProspects } from '@/lib/prospects/sortProspects'
import type { ProspectStage } from '@/lib/db/schema/enums'

interface ProspectListViewProps {
  prospects: Prospect[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  groupBy: ProspectGroupBy
}

function sectionHeading(
  t: (k: string) => string,
  groupBy: ProspectGroupBy,
  key: string,
  label: string,
): string {
  if (groupBy === 'none') return ''
  if (groupBy === 'stage') {
    const meta = STAGE_META_BY_ID[key as ProspectStage]
    return meta ? t(meta.labelKey) : key
  }
  if (groupBy === 'territory') return formatTerritoryBadge(key as Prospect['territory'])
  if (groupBy === 'owner') {
    return key === '__unassigned__' ? t('prospects.unassigned') : label
  }
  return label
}

export function ProspectListView({ prospects, selectedId, onSelect, groupBy }: ProspectListViewProps) {
  const { t, i18n } = useTranslation()

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
        <section key={section.key} className="space-y-2">
          {groupBy !== 'none' && (
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
              {sectionHeading(t, groupBy, section.key, section.label)}
              <span className="ml-2 tabular-nums text-muted/80">({section.items.length})</span>
            </h2>
          )}
          <div className="overflow-x-auto rounded-sm border border-border">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-primary/[0.02] text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-3 py-2 text-left">{t('prospects.cols.account')}</th>
                  <th className="px-3 py-2 text-left">{t('prospects.cols.territory')}</th>
                  <th className="px-3 py-2 text-left">{t('prospects.cols.source')}</th>
                  <th className="px-3 py-2 text-left">{t('prospects.cols.stage')}</th>
                  <th className="px-3 py-2 text-left">{t('prospects.cols.owner')}</th>
                  <th className="px-3 py-2 text-left">{t('prospects.cols.creator')}</th>
                  <th className="px-3 py-2 text-left">{t('prospects.cols.priority')}</th>
                  <th className="px-3 py-2 text-left">{t('prospects.cols.created')}</th>
                </tr>
              </thead>
              <tbody>
                {section.items.map((p) => {
                  const stageMeta = STAGE_META_BY_ID[p.stage]
                  const active = selectedId === p.id
                  return (
                    <tr
                      key={p.id}
                      onClick={() => onSelect(active ? null : p.id)}
                      className={cn(
                        'cursor-pointer border-t border-border transition-colors hover:bg-primary/5',
                        active && 'bg-primary/5',
                      )}
                    >
                      <td className="px-3 py-2">
                        <div className="font-medium">{p.account.name}</div>
                        {p.account.website && (
                          <div className="text-xs text-muted">{p.account.website}</div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium uppercase">
                          {formatTerritoryBadge(p.territory)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted">
                        {t(`prospects.sources.${p.source}`, { defaultValue: p.source })}
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <span className={cn('h-2 w-2 rounded-full', stageMeta.accentClass)} />
                          {t(stageMeta.labelKey)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted">
                        {p.ownerLabel ?? t('prospects.unassigned')}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted">{p.createdByLabel ?? '—'}</td>
                      <td className="px-3 py-2 text-xs tabular-nums text-muted">P{p.priority}</td>
                      <td className="px-3 py-2 text-xs text-muted">
                        {formatDate(p.createdAt, i18n.language)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  )
}
