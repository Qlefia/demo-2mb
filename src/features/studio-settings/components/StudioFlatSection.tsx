'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { studioSectionStack, studioSectionTitleClass } from '@/features/studio-settings/studioBlockChrome'

export function StudioFlatSection({
  title,
  description,
  children,
}: {
  title: ReactNode
  description?: ReactNode
  children: ReactNode
}) {
  return (
    <div className={cn(studioSectionStack, 'min-w-0')}>
      <div className="space-y-1">
        <h2 className={studioSectionTitleClass}>{title}</h2>
        {description ? <p className="max-w-prose text-sm text-pretty text-muted">{description}</p> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
