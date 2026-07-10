'use client'

import { useMemo } from 'react'
import { TabBar } from '@/components/molecules/Tabs'
import { cn } from '@/lib/cn'
import type { StudioHeroBannerMode } from '@/stores/studioProfileTypes'

interface StudioImageVideoToggleProps {
  value: StudioHeroBannerMode
  onChange: (value: StudioHeroBannerMode) => void
  labelVideo: string
  labelImage: string
  ariaLabel: string
  className?: string
}

export function StudioImageVideoToggle({
  value,
  onChange,
  labelVideo,
  labelImage,
  ariaLabel,
  className,
}: StudioImageVideoToggleProps) {
  const items = useMemo(
    () => [
      { id: 'video' as const, label: labelVideo },
      { id: 'image' as const, label: labelImage },
    ],
    [labelImage, labelVideo],
  )

  return (
    <TabBar
      items={items}
      selectedId={value}
      onChange={(id) => onChange(id as StudioHeroBannerMode)}
      ariaLabel={ariaLabel}
      variant="segmented"
      panelIdPrefix="studio-hero-banner"
      className={cn(className)}
    />
  )
}
