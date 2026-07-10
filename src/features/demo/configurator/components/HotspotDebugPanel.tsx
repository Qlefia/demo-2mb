'use client'

import { Button } from '@/components/atoms/Button'
import { cn } from '@/lib/cn'
import { demoCopy } from '../copy.en'
import type { HotspotLayoutKey } from '../hotspotLayouts'
import { getLayoutCoords } from '../hotspotLayouts'
import type { HotspotId } from '../types'
import type { HotspotLayoutOverrides } from '../hotspotLayoutStorage'

const DEBUG_LAYOUTS: HotspotLayoutKey[] = ['hero', 'kitchen', 'wall', 'workstation']

const LAYOUT_LABELS: Record<HotspotLayoutKey, string> = {
  hero: 'Main photo',
  kitchen: 'Kitchen',
  wall: 'Wall',
  workstation: 'Work zone',
}

type HotspotDebugPanelProps = {
  layout: HotspotLayoutKey
  onLayoutChange: (layout: HotspotLayoutKey) => void
  sessionOverrides?: HotspotLayoutOverrides
  onSave: () => void
  onResetLayout: (layout: HotspotLayoutKey) => void
}

const HOTSPOT_ORDER: HotspotId[] = [
  'lower-cabinets',
  'upper-cabinets',
  'backsplash',
  'wall-color',
  'furniture',
]

export function HotspotDebugPanel({
  layout,
  onLayoutChange,
  sessionOverrides,
  onSave,
  onResetLayout,
}: HotspotDebugPanelProps) {
  const coords = getLayoutCoords(layout, sessionOverrides)
  const visibleIds = HOTSPOT_ORDER.filter((id) => coords[id] != null)

  return (
    <div className="shrink-0 rounded-xl border border-amber-500/40 bg-amber-500/5 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
        Hotspot debugger
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        {demoCopy.hotspotDebugHint}
      </p>
      <p className="mt-2 font-mono text-[11px] text-muted-foreground">
        localhost:3000/demo/projects/urban-oasis/configure?hotspotDebug=1
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {DEBUG_LAYOUTS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onLayoutChange(key)}
            className={cn(
              'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
              layout === key
                ? 'border-amber-700 bg-amber-700 text-white'
                : 'border-amber-500/30 bg-background text-amber-900 hover:border-amber-600/50',
            )}
          >
            {LAYOUT_LABELS[key]}
          </button>
        ))}
      </div>

      <ul className="mt-2 space-y-0.5 font-mono text-[11px] text-muted-foreground">
        {visibleIds.map((id) => {
          const point = coords[id]!
          return (
            <li key={id}>
              {id}: x {point.x}, y {point.y}
            </li>
          )
        })}
      </ul>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="primary" onClick={onSave}>
          Save positions
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => onResetLayout(layout)}>
          Reset this view
        </Button>
      </div>
    </div>
  )
}
