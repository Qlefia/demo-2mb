'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/cn'

type ConfiguratorVideoPlayerProps = {
  src: string
  title: string
  active: boolean
  className?: string
}

export function ConfiguratorVideoPlayer({
  src,
  title,
  active,
  className,
}: ConfiguratorVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (!active) {
      video.pause()
      video.currentTime = 0
      return
    }

    void video.play().catch(() => undefined)
  }, [active, src])

  return (
    <video
      ref={videoRef}
      src={src}
      title={title}
      className={cn('h-full w-full bg-black object-contain', className)}
      controls
      playsInline
      preload="metadata"
      aria-label={title}
    />
  )
}
