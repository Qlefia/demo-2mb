'use client'

import { Plus } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import {
  studioAccentAddButtonBlock,
  studioAccentAddButtonCompact,
} from '@/features/studio-settings/studioBlockChrome'

export type StudioAccentAddButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  /** Full-width row (list footers) vs compact inline (toolbars). */
  layout?: 'compact' | 'block'
}

export function StudioAccentAddButton({
  children,
  layout = 'compact',
  className,
  type = 'button',
  ...props
}: StudioAccentAddButtonProps) {
  return (
    <button
      type={type}
      className={cn(layout === 'block' ? studioAccentAddButtonBlock : studioAccentAddButtonCompact, className)}
      {...props}
    >
      <Plus size={14} strokeWidth={1.5} className="shrink-0" aria-hidden />
      {children}
    </button>
  )
}
