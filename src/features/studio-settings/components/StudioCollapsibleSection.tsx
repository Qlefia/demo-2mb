'use client'

import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import {
  studioCollapsibleShell,
  studioRadiusBlock,
  studioRadiusBlockBottom,
  studioRadiusBlockTop,
} from '@/features/studio-settings/studioBlockChrome'

interface StudioCollapsibleSectionProps {
  title: ReactNode
  description?: ReactNode
  open: boolean
  onToggle: () => void
  children: ReactNode
  /** Static header + always-visible body (no chevron / toggle). */
  disableCollapse?: boolean
}

/**
 * Collapsible block for long studio forms. Body stays mounted when closed (`hidden`)
 * so controlled inputs (e.g. react-hook-form) keep their values.
 */
export function StudioCollapsibleSection({
  title,
  description,
  open,
  onToggle,
  children,
  disableCollapse = false,
}: StudioCollapsibleSectionProps) {
  if (disableCollapse) {
    return (
      <div className={studioCollapsibleShell}>
        <div className="border-b border-border px-3 py-2 sm:px-4 sm:py-2">
          <span className="block text-base font-semibold text-foreground">{title}</span>
          {description ? <span className="mt-0.5 block text-sm text-muted">{description}</span> : null}
        </div>
        <div className="bg-background px-3 pb-2.5 pt-2.5 sm:px-4">{children}</div>
      </div>
    )
  }

  return (
    <div className={studioCollapsibleShell}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
          'flex w-full items-start gap-2 px-3 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-4 sm:py-2',
          open ? studioRadiusBlockTop : studioRadiusBlock,
        )}
      >
        <ChevronDown
          aria-hidden
          className={cn('mt-0.5 h-4 w-4 shrink-0 text-muted transition-transform', open && 'rotate-180')}
        />
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold text-foreground">{title}</span>
          {description ? <span className="mt-0.5 block text-sm text-muted">{description}</span> : null}
        </span>
      </button>
      <div
        className={cn(
          studioRadiusBlockBottom,
          'border-t border-border bg-background px-3 pb-2.5 pt-2.5 sm:px-4',
          !open && 'hidden',
        )}
      >
        {children}
      </div>
    </div>
  )
}
