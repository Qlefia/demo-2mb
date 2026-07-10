'use client'

import { FoldVertical, UnfoldVertical } from 'lucide-react'
import { IconButton } from '@/components/atoms'
import { cn } from '@/lib/cn'
import { studioRadiusControl } from '@/features/studio-settings/studioBlockChrome'

const quietIconButton =
  'hover:bg-transparent! active:bg-transparent! hover:text-muted! focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

export const studioSectionsCollapseIconButtonClass = cn(
  studioRadiusControl,
  'h-8 w-8 shrink-0 border border-border bg-transparent text-muted',
  'hover:bg-hover! hover:text-foreground!',
  'dark:hover:bg-white/[0.08]!',
)

/** Compact expand/collapse-all control for sticky detail headers and toolbars. */
export function StudioSectionsCollapseIconButton({
  allExpanded,
  onToggleAll,
  expandLabel,
  collapseLabel,
  disabled,
  className,
}: {
  allExpanded: boolean
  onToggleAll: () => void
  expandLabel: string
  collapseLabel: string
  disabled?: boolean
  className?: string
}) {
  const actionLabel = allExpanded ? collapseLabel : expandLabel
  const ToggleIcon = allExpanded ? FoldVertical : UnfoldVertical

  return (
    <IconButton
      type="button"
      icon={ToggleIcon}
      variant="ghost"
      size="sm"
      className={cn(studioSectionsCollapseIconButtonClass, className)}
      label={actionLabel}
      onClick={onToggleAll}
      disabled={disabled}
    />
  )
}

export function StudioCollapsibleSectionsToolbar({
  label,
  allExpanded,
  onToggleAll,
  expandLabel,
  collapseLabel,
  disabled,
  minimal,
}: {
  label: string
  allExpanded: boolean
  onToggleAll: () => void
  expandLabel: string
  collapseLabel: string
  disabled?: boolean
  /** Gray label left; highlighted collapse icon right. */
  minimal?: boolean
}) {
  if (minimal) {
    return (
      <div className="flex items-center justify-between gap-3 pb-2">
        <span className="text-xs text-muted">{label}</span>
        <StudioSectionsCollapseIconButton
          allExpanded={allExpanded}
          onToggleAll={onToggleAll}
          expandLabel={expandLabel}
          collapseLabel={collapseLabel}
          disabled={disabled}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-1">
      <span className="text-xs text-muted">{label}</span>
      <StudioSectionsCollapseIconButton
        allExpanded={allExpanded}
        onToggleAll={onToggleAll}
        expandLabel={expandLabel}
        collapseLabel={collapseLabel}
        disabled={disabled}
        className={quietIconButton}
      />
    </div>
  )
}
