'use client'

import { useCallback, useEffect, useRef, useState, type Dispatch } from 'react'
import { cn } from '@/lib/cn'
import type { ConfiguratorAction } from '../configuratorReducer'
import { resolveHotspotSelection, formatHotspotZoneValue } from '../hotspotUtils'
import { selectedMaterialDescription, zoneIntroForHotspot } from '../materialDescriptions'
import type { ConfiguratorState, DesignPackage, HotspotDef } from '../types'
import type { HotspotLayoutKey } from '../hotspotLayouts'
import {
  containerPercentToImagePoint,
  imagePointToContainerPercent,
  type ObjectContainRect,
} from '../useObjectContainRect'

type ConfiguratorHotspotsProps = {
  hotspots: HotspotDef[]
  activeHotspotId: string | null
  design: DesignPackage
  state: ConfiguratorState
  dispatch: Dispatch<ConfiguratorAction>
  imageRect: ObjectContainRect | null
  containerWidth: number
  containerHeight: number
  debugMode?: boolean
  debugLayout?: HotspotLayoutKey
  onHotspotMove?: (layout: HotspotLayoutKey, id: HotspotDef['id'], x: number, y: number) => void
}

function HotspotHoverPanel({ zoneLabel, description }: { zoneLabel: string; description: string }) {
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute top-[calc(100%+0.5rem)] left-1/2 z-50 w-[min(16rem,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border border-border bg-background p-3 shadow-lg"
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {zoneLabel}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-foreground">{description}</p>
    </div>
  )
}

export function ConfiguratorHotspots({
  hotspots,
  activeHotspotId,
  design,
  state,
  dispatch,
  imageRect,
  containerWidth,
  containerHeight,
  debugMode = false,
  debugLayout,
  onHotspotMove,
}: ConfiguratorHotspotsProps) {
  const [hoveredHotspotId, setHoveredHotspotId] = useState<HotspotDef['id'] | null>(null)
  const dragRef = useRef<{
    id: HotspotDef['id']
    pointerId: number
    stage: HTMLElement
  } | null>(null)

  const container = { width: containerWidth, height: containerHeight }

  const moveHotspotToPointer = useCallback(
    (clientX: number, clientY: number, spotId: HotspotDef['id']) => {
      if (!debugMode || !imageRect || !debugLayout || !onHotspotMove || !dragRef.current) return
      if (dragRef.current.id !== spotId) return

      const stageRect = dragRef.current.stage.getBoundingClientRect()
      const leftPercent = ((clientX - stageRect.left) / stageRect.width) * 100
      const topPercent = ((clientY - stageRect.top) / stageRect.height) * 100
      const imagePoint = containerPercentToImagePoint(imageRect, container, leftPercent, topPercent)
      onHotspotMove(debugLayout, spotId, imagePoint.x, imagePoint.y)
    },
    [container, debugLayout, debugMode, imageRect, onHotspotMove],
  )

  useEffect(() => {
    if (!debugMode) return

    const onPointerMove = (event: PointerEvent) => {
      if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return
      moveHotspotToPointer(event.clientX, event.clientY, dragRef.current.id)
    }

    const endDrag = (event: PointerEvent) => {
      if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return
      dragRef.current = null
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', endDrag)
    window.addEventListener('pointercancel', endDrag)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', endDrag)
      window.removeEventListener('pointercancel', endDrag)
    }
  }, [debugMode, moveHotspotToPointer])

  if (!imageRect || containerWidth <= 0 || containerHeight <= 0) {
    return null
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {hotspots.map((spot) => {
        const active = activeHotspotId === spot.id
        const hovered = hoveredHotspotId === spot.id
        const position = imagePointToContainerPercent(imageRect, container, spot.x, spot.y)
        const selection = resolveHotspotSelection(state, design, spot)
        const materialDescription = selectedMaterialDescription(state.designId, spot, selection)
        const zoneValue = formatHotspotZoneValue(state, design, spot, selection)
        const zoneIntro = zoneIntroForHotspot(spot.id)

        const hasActiveFilter = Boolean(activeHotspotId) && !debugMode
        const dimmed = hasActiveFilter && !active

        const pinClassName = cn(
          'pointer-events-auto absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full',
          'focus:outline-none focus-visible:outline-none',
          debugMode
            ? 'z-10 size-10 cursor-grab border-2 border-amber-600 bg-amber-400/80 shadow-lg active:cursor-grabbing'
            : 'transition-all duration-200',
          !debugMode && active && 'z-20 ring-2 ring-accent',
          !debugMode && dimmed && 'opacity-35',
        )

        const pinVisual = debugMode ? (
          <span
            aria-hidden
            className="absolute inset-1 rounded-full border-2 border-dashed border-amber-900/50"
          />
        ) : (
          <>
            <span
              aria-hidden
              className={cn(
                'absolute inset-0 rounded-full border border-background/95 bg-[#D4B896]/55 shadow-[0_0_0_1px_rgba(0,0,0,0.08)]',
                active && 'border-accent bg-accent/70',
              )}
            />
            <span
              aria-hidden
              className={cn(
                'absolute inset-[2px] rounded-full border border-background/70 bg-background/30',
                active && 'border-background/90 bg-background/45',
              )}
            />
            {!active && !hasActiveFilter ? (
              <span
                aria-hidden
                className="absolute inset-0 animate-ping rounded-full bg-[#D4B896]/25"
                style={{ animationDuration: '2.8s' }}
              />
            ) : null}
          </>
        )

        if (debugMode) {
          return (
            <div
              key={spot.id}
              className="absolute"
              style={{ left: `${position.left}%`, top: `${position.top}%` }}
            >
              <div className="pointer-events-none relative -translate-x-1/2 -translate-y-1/2">
                <button
                  type="button"
                  data-testid={`configurator-hotspot-${spot.id}`}
                  aria-label={`${selection.zoneLabel}: ${zoneValue}. ${zoneIntro}`}
                  onPointerDown={(event) => {
                    if (!debugLayout || !onHotspotMove) return
                    const stage = event.currentTarget.closest(
                      '[data-testid="configurator-stage"]',
                    ) as HTMLElement | null
                    if (!stage) return
                    dragRef.current = { id: spot.id, pointerId: event.pointerId, stage }
                    event.preventDefault()
                  }}
                  className={cn(pinClassName, 'relative pointer-events-auto')}
                >
                  {pinVisual}
                </button>

                <div className="absolute top-[calc(100%+6px)] left-1/2 w-max max-w-44 -translate-x-1/2 rounded-md bg-amber-950/92 px-2 py-1 text-center shadow-md">
                  <p className="text-[10px] font-semibold leading-tight text-amber-50">
                    {selection.zoneLabel}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-amber-100/90">
                    {zoneValue} · {zoneIntro}
                  </p>
                </div>
              </div>
            </div>
          )
        }

        return (
          <div
            key={spot.id}
            className="absolute"
            style={{ left: `${position.left}%`, top: `${position.top}%` }}
          >
            <div
              className="relative -translate-x-1/2 -translate-y-1/2"
              onMouseEnter={() => setHoveredHotspotId(spot.id)}
              onMouseLeave={() => setHoveredHotspotId(null)}
            >
              <button
                type="button"
                data-testid={`configurator-hotspot-${spot.id}`}
                aria-label={`${selection.zoneLabel}: ${zoneValue}`}
                className={pinClassName}
                onClick={() =>
                  dispatch({
                    type: 'SET_ACTIVE_HOTSPOT',
                    hotspotId: spot.id,
                  })
                }
              >
                {pinVisual}
                <span className="sr-only">{spot.label}</span>
              </button>

              {hovered && (!activeHotspotId || active) ? (
                <HotspotHoverPanel zoneLabel={selection.zoneLabel} description={materialDescription} />
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
