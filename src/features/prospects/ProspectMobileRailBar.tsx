'use client'

import { PanelLeftOpen, PanelRightOpen } from 'lucide-react'
import { cn } from '@/lib/cn'

type ProspectMobileRailBarProps = {
  companyLabel: string
  toolsLabel: string
  onOpenCompany: () => void
  onOpenTools: () => void
  className?: string
}

const railButtonClass = cn(
  'inline-flex h-10 min-w-0 w-full items-center justify-center gap-2',
  'rounded-[var(--form-field-radius)] border border-border bg-background px-3',
  'text-sm font-medium text-foreground transition-colors',
  'hover:bg-hover active:bg-primary/10',
  'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
)

export function ProspectMobileRailBar({
  companyLabel,
  toolsLabel,
  onOpenCompany,
  onOpenTools,
  className,
}: ProspectMobileRailBarProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-2 border-b border-border bg-background py-2 lg:hidden',
        className,
      )}
    >
      <button type="button" className={railButtonClass} onClick={onOpenCompany}>
        <PanelLeftOpen size={16} strokeWidth={1.25} className="shrink-0 text-muted" aria-hidden />
        <span className="min-w-0 truncate">{companyLabel}</span>
      </button>
      <button type="button" className={railButtonClass} onClick={onOpenTools}>
        <PanelRightOpen size={16} strokeWidth={1.25} className="shrink-0 text-muted" aria-hidden />
        <span className="min-w-0 truncate">{toolsLabel}</span>
      </button>
    </div>
  )
}
