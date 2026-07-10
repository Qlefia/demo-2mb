'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface ValueWithActionsProps {
  value: ReactNode
  actions: ReactNode
  valueClassName?: string
  actionsClassName?: string
  actionsVisible?: boolean
  className?: string
  groupScope?: string
}

/**
 * Shows a value (e.g. count, score) always visible. On hover, hides value and reveals actions.
 * Used in cards, column headers, etc. Parent must have `group` or `group/{scope}` class.
 */
export function ValueWithActions({
  value,
  actions,
  valueClassName = '',
  actionsClassName = '',
  actionsVisible = false,
  className = '',
  groupScope,
}: ValueWithActionsProps) {
  const hoverHide = groupScope ? `group-hover/${groupScope}:opacity-0` : 'group-hover:opacity-0'
  const hoverShow = groupScope ? `group-hover/${groupScope}:opacity-100` : 'group-hover:opacity-100'

  return (
    <div className={cn('relative flex h-6 min-w-6 shrink-0 items-center justify-center', className)}>
      <span
        className={cn(
          'pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] tabular-nums text-muted/80 transition-opacity',
          actionsVisible ? 'opacity-0' : hoverHide,
          valueClassName,
        )}
      >
        {value}
      </span>
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center transition-opacity',
          actionsVisible ? 'opacity-100' : `opacity-0 ${hoverShow}`,
          actionsClassName,
        )}
      >
        {actions}
      </div>
    </div>
  )
}
