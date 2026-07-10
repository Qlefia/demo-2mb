'use client'

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { studioRadiusNested } from '@/features/studio-settings/studioBlockChrome'
import { pickRandomPastelHoverTint } from '@/lib/ui/pastelHoverTint'

interface CalendarEventChipProps {
  selected?: boolean
  dense?: boolean
  className?: string
  style?: CSSProperties
  title?: string
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  children: ReactNode
}

export function CalendarEventChip({
  selected,
  dense = false,
  className,
  style,
  title,
  onClick,
  children,
}: CalendarEventChipProps) {
  const [hoverTint, setHoverTint] = useState<string | null>(null)

  useEffect(() => {
    if (selected) {
      setHoverTint((current) => current ?? pickRandomPastelHoverTint())
      return
    }
    setHoverTint(null)
  }, [selected])

  function handleMouseEnter() {
    if (selected) return
    setHoverTint(pickRandomPastelHoverTint())
  }

  function handleFocus() {
    if (selected) return
    setHoverTint((current) => current ?? pickRandomPastelHoverTint())
  }

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (!selected) {
      setHoverTint((current) => current ?? pickRandomPastelHoverTint())
    }
    onClick?.(e)
  }

  return (
    <button
      type="button"
      data-selected={selected ? 'true' : undefined}
      title={title}
      style={
        hoverTint
          ? { ...style, ['--event-hover-tint' as string]: hoverTint }
          : style
      }
      className={cn(
        'calendar-event-chip group relative overflow-visible text-left focus-visible:outline-none',
        studioRadiusNested,
        className,
      )}
      onMouseEnter={handleMouseEnter}
      onFocus={handleFocus}
      onClick={handleClick}
    >
      <span aria-hidden className="calendar-event-bloom bg-(--event-hover-tint)" />
      <span
        className={cn(
          'calendar-event-surface relative z-10 flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden border border-border bg-background',
          studioRadiusNested,
          dense ? 'px-1 py-0.5' : 'px-1.5 py-1',
        )}
      >
        {children}
      </span>
    </button>
  )
}
