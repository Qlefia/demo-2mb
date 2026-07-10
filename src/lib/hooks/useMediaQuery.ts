'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'

function subscribe(query: string, onChange: () => void) {
  const mq = window.matchMedia(query)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

function getSnapshot(query: string) {
  return window.matchMedia(query).matches
}

/**
 * Matches a CSS media query after client mount. Before hydration completes,
 * always returns `false` so server markup and the first client pass agree
 * (avoids wide/narrow layout mismatch on desktop).
 */
export function useMediaQuery(query: string): boolean {
  const matches = useSyncExternalStore(
    (onChange) => subscribe(query, onChange),
    () => getSnapshot(query),
    () => false,
  )
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    setHydrated(true)
  }, [])
  return hydrated && matches
}
