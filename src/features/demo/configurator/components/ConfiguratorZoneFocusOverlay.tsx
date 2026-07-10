'use client'

import type { HotspotDef } from '../types'
import { imagePointToContainerPercent, type ObjectContainRect } from '../useObjectContainRect'

type ConfiguratorZoneFocusOverlayProps = {
  activeSpot: HotspotDef | null
  imageRect: ObjectContainRect | null
  containerWidth: number
  containerHeight: number
}

export function ConfiguratorZoneFocusOverlay({
  activeSpot,
  imageRect,
  containerWidth,
  containerHeight,
}: ConfiguratorZoneFocusOverlayProps) {
  if (!activeSpot || !imageRect || containerWidth <= 0 || containerHeight <= 0) {
    return null
  }

  const container = { width: containerWidth, height: containerHeight }
  const position = imagePointToContainerPercent(imageRect, container, activeSpot.x, activeSpot.y)

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[5] transition-opacity duration-300"
      style={{
        background: `radial-gradient(circle 22% at ${position.left}% ${position.top}%, transparent 0%, rgba(0,0,0,0.42) 100%)`,
      }}
    />
  )
}
