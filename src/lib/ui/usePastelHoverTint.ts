'use client'

import { useEffect, useState } from 'react'
import { pickPastelHoverTint, pickRandomPastelHoverTint } from '@/lib/ui/pastelHoverTint'

type UsePastelHoverTintOptions = {
  active?: boolean
  /** Stable tint per entity (prospect id, …). Omit for a new random tint on each hover. */
  tintKey?: string
}

export function usePastelHoverTint({ active = false, tintKey }: UsePastelHoverTintOptions = {}) {
  const [hoverTint, setHoverTint] = useState<string | null>(null)

  const pickTint = () => (tintKey ? pickPastelHoverTint(tintKey) : pickRandomPastelHoverTint())

  useEffect(() => {
    if (active) {
      setHoverTint((current) => current ?? pickTint())
      return
    }
    setHoverTint(null)
  }, [active, tintKey])

  return {
    hoverTint,
    hoverStyle: hoverTint ? ({ ['--event-hover-tint' as string]: hoverTint } as const) : undefined,
    onMouseEnter: () => {
      if (!active) setHoverTint(pickTint())
    },
    onFocus: () => {
      if (!active) setHoverTint((current) => current ?? pickTint())
    },
    pinTint: () => setHoverTint((current) => current ?? pickTint()),
  }
}
