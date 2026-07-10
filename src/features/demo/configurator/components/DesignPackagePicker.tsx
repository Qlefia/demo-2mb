'use client'

import Image from 'next/image'
import { cn } from '@/lib/cn'
import { studioRadiusNested } from '@/features/studio-settings/studioBlockChrome'
import { DESIGN_PALETTES } from '../designPalettes'
import { demoCopy } from '../copy.en'
import type { ConfiguratorManifest, DesignId } from '../types'

type DesignPackagePickerProps = {
  manifest: ConfiguratorManifest
  selectedId: DesignId
  onChange: (id: DesignId) => void
}

const DESIGN_ORDER: DesignId[] = ['design-1', 'design-2', 'design-3']

export function DesignPackagePicker({ manifest, selectedId, onChange }: DesignPackagePickerProps) {
  const selectedPalette = DESIGN_PALETTES[selectedId]

  return (
    <section aria-label={demoCopy.chooseDesignTitle} className="shrink-0 space-y-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {demoCopy.chooseDesignTitle}
      </p>

      <div className="grid grid-cols-3 gap-2">
        {DESIGN_ORDER.map((id) => {
          const design = manifest.designs[id]
          const palette = DESIGN_PALETTES[id]
          const selected = selectedId === id

          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={cn(
                'group flex flex-col gap-1.5 text-left outline-none transition-opacity',
                selected ? 'opacity-100' : 'opacity-80 hover:opacity-100',
              )}
              aria-pressed={selected}
            >
              <span
                className={cn(
                  'relative box-border block aspect-video w-full overflow-hidden border-2 border-transparent bg-muted/30',
                  studioRadiusNested,
                  selected && 'ring-2 ring-[#D99E6A] ring-inset',
                )}
              >
                <Image
                  src={design.heroImage}
                  alt=""
                  fill
                  unoptimized
                  sizes="120px"
                  className="object-contain"
                />
              </span>
              <span
                className={cn(
                  'line-clamp-2 text-center text-[11px] leading-tight',
                  selected ? 'font-medium text-foreground' : 'text-muted-foreground',
                )}
              >
                {palette.name}
              </span>
            </button>
          )
        })}
      </div>

      {selectedPalette ? (
        <p className="pt-0.5 text-xs leading-relaxed text-muted-foreground">
          {selectedPalette.description}
        </p>
      ) : null}
    </section>
  )
}
