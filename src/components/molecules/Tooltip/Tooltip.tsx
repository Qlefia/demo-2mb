'use client'

import { useState, type ReactNode } from 'react'

interface TooltipProps {
  content: string
  children: ReactNode
  position?: 'top' | 'bottom'
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false)

  const positionClasses = position === 'top'
    ? 'bottom-full left-1/2 mb-2 -translate-x-1/2'
    : 'top-full left-1/2 mt-2 -translate-x-1/2'

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className={`absolute z-50 whitespace-nowrap rounded-sm border border-border bg-foreground px-2 py-1 text-xs text-background ${positionClasses}`}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </div>
  )
}
