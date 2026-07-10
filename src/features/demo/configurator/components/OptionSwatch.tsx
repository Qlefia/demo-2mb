'use client'

import Image from 'next/image'
import { cn } from '@/lib/cn'
import { CONFIGURATOR_PLACEHOLDER } from '../assets'
import { studioRadiusNested } from '@/features/studio-settings/studioBlockChrome'

type OptionSwatchProps = {
  id: string
  label: string
  imageUrl: string
  selected: boolean
  onSelect: (id: string) => void
  compact?: boolean
  priceLabel?: string | null
}

export function OptionSwatch({
  id,
  label,
  imageUrl,
  selected,
  onSelect,
  compact = false,
  priceLabel,
}: OptionSwatchProps) {
  const isPlaceholder = imageUrl === CONFIGURATOR_PLACEHOLDER

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={cn(
        'group flex shrink-0 flex-col gap-1 text-left transition-opacity',
        compact ? 'w-[72px]' : 'w-[88px]',
        selected ? 'opacity-100' : 'opacity-80 hover:opacity-100',
      )}
      aria-pressed={selected}
    >
      <span
        className={cn(
          'relative box-border block aspect-[4/3] w-full overflow-hidden border-2 border-transparent',
          studioRadiusNested,
          isPlaceholder ? 'bg-[#E8E8E8]' : 'bg-muted/30',
          selected && 'ring-2 ring-[#D99E6A] ring-inset',
        )}
      >
        {isPlaceholder ? (
          <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
            <span className="h-10 w-14 rounded bg-[#D4D4D4]" />
          </span>
        ) : (
          <Image
            src={imageUrl}
            alt=""
            fill
            unoptimized
            sizes="88px"
            className="object-cover"
          />
        )}
      </span>
      <span className="line-clamp-2 text-[11px] leading-tight text-foreground">{label}</span>
      {priceLabel ? (
        <span className="text-[10px] font-medium tabular-nums text-muted-foreground">{priceLabel}</span>
      ) : null}
    </button>
  )
}

type OptionSwatchRowProps = {
  title: string
  options: { id: string; label: string; imageUrl: string; priceLabel?: string | null }[]
  selectedId: string
  onSelect: (id: string) => void
  compact?: boolean
}

export function OptionSwatchRow({
  title,
  options,
  selectedId,
  onSelect,
  compact = false,
}: OptionSwatchRowProps) {
  return (
    <div className="space-y-1.5">
      {title ? (
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
      ) : null}
      <div className="flex gap-2 overflow-x-auto overscroll-x-contain">
        {options.map((opt) => (
          <OptionSwatch
            key={opt.id}
            id={opt.id}
            label={opt.label}
            imageUrl={opt.imageUrl}
            selected={selectedId === opt.id}
            onSelect={onSelect}
            compact={compact}
            priceLabel={opt.priceLabel}
          />
        ))}
      </div>
    </div>
  )
}
