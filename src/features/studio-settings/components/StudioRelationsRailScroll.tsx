'use client'

import type { ReactNode } from 'react'
import {
  studioRelationListScroll,
  studioRelationsRailTabBody,
} from '@/features/studio-settings/studioBlockChrome'
import { cn } from '@/lib/cn'

type StudioRelationsRailScrollProps = {
  children: ReactNode
  className?: string
}

/** Fills the relations tab and scrolls long form content (pricing, groups chips, …). */
export function StudioRelationsRailScroll({ children, className }: StudioRelationsRailScrollProps) {
  return (
    <div className={cn(studioRelationsRailTabBody, className)}>
      <div className={studioRelationListScroll}>{children}</div>
    </div>
  )
}

type StudioRelationsTabBodyProps = {
  children: ReactNode
  className?: string
}

/** Flex slot for list pickers that manage their own inner scroll via {@link StudioRelationListShell}. */
export function StudioRelationsTabBody({ children, className }: StudioRelationsTabBodyProps) {
  return <div className={cn(studioRelationsRailTabBody, className)}>{children}</div>
}
