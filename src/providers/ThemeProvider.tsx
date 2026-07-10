'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useUserStore } from '@/stores/userStore'

export function ThemeProvider() {
  const themeMode = useUserStore((s) => s.themeMode)
  const pathname = usePathname()
  const forceLightDemo = pathname.startsWith('/demo')

  useEffect(() => {
    const root = document.documentElement

    const apply = (dark: boolean) => {
      root.classList.toggle('dark', dark)
    }

    if (forceLightDemo) {
      apply(false)
      return
    }

    if (themeMode === 'light') {
      apply(false)
      return
    }

    if (themeMode === 'dark') {
      apply(true)
      return
    }

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    apply(mq.matches)

    const handler = (e: MediaQueryListEvent) => apply(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [themeMode, forceLightDemo])

  return null
}
