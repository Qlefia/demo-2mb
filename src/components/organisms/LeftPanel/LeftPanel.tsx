import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface LeftPanelProps {
  children: ReactNode
  className?: string
}

export function LeftPanel({ children, className }: LeftPanelProps) {
  return (
    <div
      className={cn(
        'flex w-80 shrink-0 flex-col border-r border-border bg-background',
        className,
      )}
    >
      <div className="flex h-full min-h-0 flex-col">{children}</div>
    </div>
  )
}
