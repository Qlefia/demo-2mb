'use client'

import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { studioBlockStack } from '@/features/studio-settings/studioBlockChrome'

interface StudioMinimalCollapsibleSectionProps {
  title: ReactNode
  description?: ReactNode
  open: boolean
  onToggle: () => void
  children: ReactNode
  /** Right side of the header row (e.g. AI assist). */
  trailing?: ReactNode
  /** Static header + always-visible body (no chevron / toggle). */
  disableCollapse?: boolean
}

function SectionHeaderCopy({ title, description }: { title: ReactNode; description?: ReactNode }) {
  return (
    <>
      <span className="block text-sm font-semibold text-foreground">{title}</span>
      {description ? <span className="mt-0.5 block text-xs font-normal text-muted">{description}</span> : null}
    </>
  )
}

/**
 * Borderless accordion row — same pattern as General / Legal / Offices. Body stays mounted when closed.
 */
export function StudioMinimalCollapsibleSection({
  title,
  description,
  open,
  onToggle,
  children,
  trailing,
  disableCollapse = false,
}: StudioMinimalCollapsibleSectionProps) {
  if (disableCollapse) {
    return (
      <section className="min-w-0">
        <div className="flex items-start gap-2 pt-0.5 pb-1">
          <div className="min-w-0 flex-1">
            <SectionHeaderCopy title={title} description={description} />
          </div>
          {trailing ? <div className="shrink-0">{trailing}</div> : null}
        </div>
        <div className={cn(studioBlockStack, 'pb-2')}>{children}</div>
      </section>
    )
  }

  return (
    <section className="min-w-0">
      <div className="flex items-center gap-2 py-2">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="min-w-0 flex-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <SectionHeaderCopy title={title} description={description} />
        </button>
        {trailing ? <div className="shrink-0 self-start">{trailing}</div> : null}
        <button
          type="button"
          onClick={onToggle}
          tabIndex={-1}
          aria-hidden
          className="ml-auto shrink-0 self-start p-0.5 text-muted outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ChevronDown
            aria-hidden
            className={cn('h-4 w-4 transition-transform', open && 'rotate-180')}
          />
        </button>
      </div>
      <div className={cn(!open && 'hidden')}>
        <div className={cn(studioBlockStack, 'pb-4')}>{children}</div>
      </div>
    </section>
  )
}
