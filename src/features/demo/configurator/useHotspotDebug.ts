'use client'

import { useCallback, useState } from 'react'
import { toast } from '@/components/molecules/Toast'
import {
  buildFullOverridesFromSession,
  mergeAllLayoutOverrides,
  type HotspotLayoutKey,
} from './hotspotLayouts'
import {
  clearHotspotOverridesFromStorage,
  formatOverridesAsTypeScript,
  loadHotspotOverridesFromStorage,
  saveHotspotOverridesToStorage,
  type HotspotLayoutOverrides,
} from './hotspotLayoutStorage'
import type { HotspotId } from './types'

export function useHotspotDebug(enabled: boolean) {
  const [debugLayout, setDebugLayout] = useState<HotspotLayoutKey>('hero')
  const [sessionOverrides, setSessionOverrides] = useState<HotspotLayoutOverrides>(() =>
    enabled ? loadHotspotOverridesFromStorage() : {},
  )

  const moveHotspot = useCallback(
    (layout: HotspotLayoutKey, id: HotspotId, x: number, y: number) => {
      if (!enabled) return
      setSessionOverrides((prev) =>
        mergeAllLayoutOverrides(prev, {
          [layout]: { [id]: { x, y } },
        }),
      )
    },
    [enabled],
  )

  const saveToBrowser = useCallback(() => {
    const full = buildFullOverridesFromSession(sessionOverrides)
    saveHotspotOverridesToStorage(full)
    toast('Hotspot positions saved in this browser', 'success')
  }, [sessionOverrides])

  const saveToProject = useCallback(async () => {
    const full = buildFullOverridesFromSession(sessionOverrides)
    const res = await fetch('/api/demo/configurator/hotspot-layouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(full),
    })
    if (!res.ok) {
      const payload = (await res.json().catch(() => null)) as { error?: string } | null
      toast(payload?.error ?? 'Could not save hotspot layout file', 'error')
      return
    }
    toast('Saved to hotspot-layout-overrides.json in the project', 'success')
  }, [sessionOverrides])

  const copyJson = useCallback(async () => {
    const full = buildFullOverridesFromSession(sessionOverrides)
    await navigator.clipboard.writeText(JSON.stringify(full, null, 2))
    toast('Layout JSON copied to clipboard', 'success')
  }, [sessionOverrides])

  const copyTypeScript = useCallback(async () => {
    const full = buildFullOverridesFromSession(sessionOverrides)
    await navigator.clipboard.writeText(formatOverridesAsTypeScript(full))
    toast('TypeScript snippet copied to clipboard', 'success')
  }, [sessionOverrides])

  const resetCurrentLayout = useCallback((layout: HotspotLayoutKey) => {
    setSessionOverrides((prev) => {
      const next = { ...prev }
      delete next[layout]
      return next
    })
    toast(`Reset layout: ${layout}`, 'success')
  }, [])

  const resetAll = useCallback(() => {
    setSessionOverrides({})
    clearHotspotOverridesFromStorage()
    toast('All hotspot overrides cleared in this browser', 'success')
  }, [])

  const saveAll = useCallback(async () => {
    const full = buildFullOverridesFromSession(sessionOverrides)
    saveHotspotOverridesToStorage(full)
    const res = await fetch('/api/demo/configurator/hotspot-layouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(full),
    })
    if (!res.ok) {
      const payload = (await res.json().catch(() => null)) as { error?: string } | null
      toast(payload?.error ?? 'Saved in browser only — could not write project file', 'error')
      return
    }
    toast('Hotspot positions saved (browser + hotspot-layout-overrides.json)', 'success')
  }, [sessionOverrides])

  return {
    debugLayout,
    setDebugLayout,
    sessionOverrides: enabled ? sessionOverrides : undefined,
    moveHotspot,
    saveAll,
    saveToBrowser,
    saveToProject,
    copyJson,
    copyTypeScript,
    resetCurrentLayout,
    resetAll,
  }
}
