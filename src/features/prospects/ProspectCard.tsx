'use client'

import { useTranslation } from 'react-i18next'
import { Building2, MapPin, User, UserCircle } from 'lucide-react'
import { cn } from '@/lib/cn'
import { usePastelHoverTint } from '@/lib/ui/usePastelHoverTint'
import type { Prospect } from './types'
import { STAGE_META_BY_ID } from './stageMeta'
import { formatTerritoryBadge } from './labels'
import { ProspectPinButton } from './ProspectPinButton'

interface ProspectCardProps {
  prospect: Prospect
  selected?: boolean
  onSelect?: (id: string) => void
  className?: string
  /** Equal-height layout for card grid view. */
  uniformHeight?: boolean
}

export function ProspectCard({ prospect, selected, onSelect, className, uniformHeight }: ProspectCardProps) {
  const { t } = useTranslation()
  const stageMeta = STAGE_META_BY_ID[prospect.stage]
  const { hoverTint, hoverStyle, onMouseEnter, onFocus, pinTint } = usePastelHoverTint({
    active: Boolean(selected),
    tintKey: prospect.id,
  })

  const handleActivate = () => {
    pinTint()
    onSelect?.(prospect.id)
  }

  return (
    <div
      role="group"
      data-selected={selected ? 'true' : undefined}
      onClick={handleActivate}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleActivate()
        }
      }}
      tabIndex={0}
      onMouseEnter={onMouseEnter}
      onFocus={onFocus}
      style={hoverStyle}
      className={cn(
        'calendar-event-chip group relative w-full cursor-pointer overflow-visible text-left focus-visible:outline-none',
        'rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
        uniformHeight && 'h-full',
        className,
      )}
    >
      <span aria-hidden className={cn('calendar-event-bloom rounded-sm', hoverTint && 'bg-(--event-hover-tint)')} />
      <span
        className={cn(
          'calendar-event-surface relative z-10 flex w-full flex-col gap-2 rounded-sm border border-border bg-background px-3 py-2.5 transition-colors',
          uniformHeight && 'h-full',
        )}
      >
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-sm font-medium leading-none">
          {prospect.account.name || t('prospects.unknownAccount')}
        </span>
        <div className="flex shrink-0 items-center gap-0.5">
          <ProspectPinButton prospectId={prospect.id} className="h-7 w-7" />
          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 crm-meta-label">
            {formatTerritoryBadge(prospect.territory)}
          </span>
        </div>
      </div>

      {uniformHeight ? (
        <p className="line-clamp-2 min-h-[2.5rem] text-xs leading-5 text-muted">
          {prospect.latestTrigger?.text ?? '\u00a0'}
        </p>
      ) : (
        prospect.latestTrigger?.text && (
          <p className="line-clamp-2 text-xs text-muted">{prospect.latestTrigger.text}</p>
        )
      )}

      <div className="flex items-center gap-1.5 text-xs text-muted">
        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', stageMeta.accentClass)} />
        <span className="min-w-0 truncate">{t(stageMeta.labelKey)}</span>
      </div>

      {uniformHeight ? (
        <div className="flex flex-col gap-1 text-xs text-muted">
          <span className="inline-flex min-w-0 items-center gap-1">
            <User size={11} className="shrink-0" aria-hidden />
            <span className="shrink-0 font-medium text-foreground/80">{t('prospects.cols.owner')}:</span>
            <span className="truncate">{prospect.ownerLabel ?? t('prospects.unassigned')}</span>
          </span>
          <span className="inline-flex min-w-0 items-center gap-1">
            <UserCircle size={11} className="shrink-0" aria-hidden />
            <span className="shrink-0 font-medium text-foreground/80">
              {t('prospects.card.createdBy')}:
            </span>
            <span className="truncate">{prospect.createdByLabel ?? '—'}</span>
          </span>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          <span className="inline-flex min-w-0 items-center gap-1">
            <User size={11} className="shrink-0" aria-hidden />
            <span className="shrink-0 font-medium text-foreground/80">{t('prospects.cols.owner')}:</span>
            <span className="truncate">{prospect.ownerLabel ?? t('prospects.unassigned')}</span>
          </span>
          <span className="opacity-50">·</span>
          <span className="inline-flex min-w-0 items-center gap-1">
            <UserCircle size={11} className="shrink-0" aria-hidden />
            <span className="shrink-0 font-medium text-foreground/80">
              {t('prospects.card.createdBy')}:
            </span>
            <span className="truncate">{prospect.createdByLabel ?? '—'}</span>
          </span>
        </div>
      )}

      <div className={cn('flex items-center gap-2 text-xs text-muted', uniformHeight && 'mt-auto')}>
        <span className="inline-flex items-center gap-1">
          <Building2 size={11} aria-hidden />
          {t(`prospects.sources.${prospect.source}`, { defaultValue: prospect.source })}
        </span>
        <span className="opacity-50">·</span>
        <span className="inline-flex items-center gap-1">
          <MapPin size={11} aria-hidden />
          P{prospect.priority}
        </span>
      </div>
      </span>
    </div>
  )
}
