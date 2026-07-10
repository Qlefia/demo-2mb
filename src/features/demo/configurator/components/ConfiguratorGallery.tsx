'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/cn'
import { studioRadiusNested } from '@/features/studio-settings/studioBlockChrome'
import { demoCopy } from '../copy.en'

const THUMB_MAX_HEIGHT_PX = 72

type ConfiguratorGalleryProps = {
  urls: string[]
  activeUrl: string
  onSelect: (url: string) => void
  className?: string
}

export function ConfiguratorGallery({ urls, activeUrl, onSelect, className }: ConfiguratorGalleryProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeIndex = Math.max(0, urls.indexOf(activeUrl))

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const thumb = el.querySelector(`[data-testid="configurator-gallery-thumb-${activeIndex}"]`)
    thumb?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
  }, [activeIndex])

  return (
    <nav
      aria-label={demoCopy.galleryAria}
      className={cn('shrink-0', className)}
      style={{ height: THUMB_MAX_HEIGHT_PX }}
    >
      <div ref={scrollRef} className="h-full overflow-x-auto overflow-y-hidden overscroll-x-contain">
        <div className="flex h-full items-center gap-2 pr-1">
          {urls.map((url, index) => {
            const selected = url === activeUrl

            return (
              <button
                key={url}
                type="button"
                data-testid={`configurator-gallery-thumb-${index}`}
                onClick={() => onSelect(url)}
                aria-current={selected ? 'true' : undefined}
                className="group flex h-full shrink-0 items-center outline-none"
              >
                <span
                  className={cn(
                    'relative box-border block h-full w-24 shrink-0 overflow-hidden border-2 border-transparent',
                    studioRadiusNested,
                    selected && 'ring-2 ring-[#D99E6A] ring-inset',
                    !selected && 'group-hover:ring-1 group-hover:ring-border group-hover:ring-inset',
                  )}
                >
                  <img
                    src={url}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
