'use client'

import type { ReactNode } from 'react'

interface SidebarToolbarProps {
  children: ReactNode
}

export function SidebarToolbar({ children }: SidebarToolbarProps) {
  return (
    <div className="flex shrink-0 items-center gap-1 border-b border-border bg-background px-3 py-2">
      {children}
    </div>
  )
}
