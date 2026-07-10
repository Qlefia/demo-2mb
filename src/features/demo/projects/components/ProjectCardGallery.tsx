'use client'

import { useCallback, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/cn'

type ProjectCardGalleryProps = {
  images: string[]
  title: string
  href?: string
  className?: string
}

export function ProjectCardGallery({ images, title, href, className }: ProjectCardGalleryProps) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const slides = images.length > 0 ? images : []

  const indexFromClientX = useCallback(
    (clientX: number) => {
      const el = containerRef.current
      if (!el || slides.length <= 1) return 0
      const { left, width } = el.getBoundingClientRect()
      if (width <= 0) return 0
      const ratio = Math.min(Math.max((clientX - left) / width, 0), 0.999999)
      return Math.min(Math.floor(ratio * slides.length), slides.length - 1)
    },
    [slides.length],
  )

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (slides.length <= 1) return
    setActiveIndex(indexFromClientX(event.clientX))
  }

  const onPointerLeave = () => {
    setActiveIndex(0)
  }

  const onClick = () => {
    if (href) router.push(href)
  }

  if (slides.length === 0) {
    return <div className={cn('aspect-[4/3] bg-muted/30', className)} />
  }

  if (slides.length === 1) {
    return (
      <div
        ref={containerRef}
        className={cn('relative aspect-[4/3] cursor-pointer overflow-hidden bg-muted/30', className)}
        onClick={onClick}
        role={href ? 'link' : undefined}
        tabIndex={href ? 0 : undefined}
        onKeyDown={(event) => {
          if (href && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault()
            router.push(href)
          }
        }}
      >
        <Image
          src={slides[0]}
          alt=""
          fill
          unoptimized
          sizes="(max-width: 640px) 100vw, 25vw"
          className="object-cover"
        />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative aspect-[4/3] cursor-pointer overflow-hidden bg-muted/30',
        className,
      )}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onClick={onClick}
      role={href ? 'link' : undefined}
      tabIndex={href ? 0 : undefined}
      onKeyDown={(event) => {
        if (href && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault()
          router.push(href)
        }
      }}
    >
      {slides.map((src, index) => (
        <Image
          key={`${src}-${index}`}
          src={src}
          alt=""
          fill
          unoptimized
          draggable={false}
          sizes="(max-width: 640px) 100vw, 25vw"
          className={cn(
            'pointer-events-none object-cover transition-opacity duration-150',
            index === activeIndex ? 'opacity-100' : 'opacity-0',
          )}
        />
      ))}

      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center px-4">
        <div className="flex h-1 w-full max-w-[72px] gap-1">
          {slides.map((_, index) => (
            <span
              key={`${title}-dot-${index}`}
              className={cn(
                'min-w-0 flex-1 rounded-full transition-colors duration-150',
                index === activeIndex ? 'bg-background' : 'bg-background/40',
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
