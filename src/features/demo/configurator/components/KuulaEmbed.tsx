'use client'

import { useState } from 'react'
import { Spinner } from '@/components/atoms/Spinner'
import { demoCopy } from '../copy.en'

const KUULA_IFRAME_ALLOW =
  'fullscreen; vr; autoplay; gyroscope; accelerometer; picture-in-picture; encrypted-media'

type KuulaEmbedProps = {
  embedUrl?: string
  title: string
}

export function KuulaEmbed({ embedUrl, title }: KuulaEmbedProps) {
  const [loaded, setLoaded] = useState(false)

  if (!embedUrl) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-muted/30 text-sm text-muted-foreground">
        <p>{demoCopy.kuulaPending}</p>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {!loaded ? (
        <div
          className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-muted/15"
          aria-hidden
        >
          <Spinner size={28} />
        </div>
      ) : null}
      <iframe
        key={embedUrl}
        src={embedUrl}
        title={title}
        className="absolute inset-0 h-full w-full border-0"
        allow={KUULA_IFRAME_ALLOW}
        allowFullScreen
        loading="eager"
        referrerPolicy="strict-origin-when-cross-origin"
        onLoad={() => setLoaded(true)}
      />
    </div>
  )
}
