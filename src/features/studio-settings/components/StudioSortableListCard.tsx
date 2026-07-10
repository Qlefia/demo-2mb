'use client'

import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { MoreVertical } from 'lucide-react'
import { IconButton } from '@/components/atoms'
import { DropdownMenu } from '@/components/molecules'
import type { DropdownMenuEntry } from '@/components/molecules'
import { useStudioSalesListCardLayout } from '@/features/studio-settings/lib/StudioSalesListLayoutContext'
import { StudioLabeledMetaChip, type StudioMetaChipKind } from '@/features/studio-settings/components/StudioLabeledMetaChip'
import {
  studioListCardChip,
  studioListCardThumb,
  studioListCardThumbGrid,
  studioSortableListCard,
} from '@/features/studio-settings/studioBlockChrome'
import { cn } from '@/lib/cn'

export type StudioSortableListChip = {
  id: string
  label: string
  kind?: StudioMetaChipKind | 'plain'
}

const GRID_CHIP_CAP = 3

export type StudioSortableListCardProps = {
  dragHandle: ReactNode
  href: string
  menuItems: DropdownMenuEntry[]
  menuTriggerAriaLabel: string
  thumbnailUrl?: string | null
  eyebrow?: string | null
  title: string
  titleEndAdornment?: ReactNode
  subtitle?: string | null
  description?: string | null
  metaLine?: { icon: LucideIcon; text: string } | null
  footerMutedLine?: string | null
  chips?: readonly StudioSortableListChip[]
  chipsSectionLabel?: string | null
  chipsOverflowCount?: number
  chipsOverflowLabel?: string | null
  tagsFallback?: string | null
  topEndAdornment?: ReactNode
}

function CardOverflowMenu({
  menuItems,
  menuTriggerAriaLabel,
  className,
}: {
  menuItems: DropdownMenuEntry[]
  menuTriggerAriaLabel: string
  className?: string
}) {
  return (
    <div className={cn('shrink-0', className)} onClick={(e) => e.stopPropagation()}>
      <DropdownMenu
        align="right"
        trigger={
          <IconButton icon={MoreVertical} variant="ghost" size="sm" label={menuTriggerAriaLabel} />
        }
        items={menuItems}
      />
    </div>
  )
}

export function StudioSortableListCard({
  dragHandle,
  href,
  menuItems,
  menuTriggerAriaLabel,
  thumbnailUrl,
  eyebrow,
  title,
  titleEndAdornment,
  subtitle,
  description,
  metaLine,
  footerMutedLine,
  chips,
  chipsSectionLabel,
  chipsOverflowCount,
  chipsOverflowLabel,
  tagsFallback,
  topEndAdornment,
}: StudioSortableListCardProps) {
  const layout = useStudioSalesListCardLayout()
  const isGrid = layout === 'grid'

  const eyebrowT = eyebrow?.trim()
  const subtitleT = subtitle?.trim()
  const descriptionT = description?.trim()
  const metaText = metaLine?.text?.trim()
  const MetaIcon = metaLine?.icon
  const footerT = footerMutedLine?.trim()
  const tagsT = tagsFallback?.trim()
  const chipList = (chips ?? [])
    .map((c) => ({ id: c.id, label: c.label.trim(), kind: c.kind ?? 'plain' }))
    .filter((c) => c.label.length > 0)
  const hasChips = chipList.length > 0
  const chipsSectionLabelT = chipsSectionLabel?.trim() ?? ''
  const overflowLabel = chipsOverflowLabel?.trim() ?? ''
  const showOverflow =
    typeof chipsOverflowCount === 'number' && chipsOverflowCount > 0 && overflowLabel.length > 0
  const visibleChips = isGrid ? chipList.slice(0, GRID_CHIP_CAP) : chipList
  const gridHiddenChips = isGrid ? Math.max(0, chipList.length - GRID_CHIP_CAP) : 0
  const gridMoreCount = gridHiddenChips + (showOverflow ? (chipsOverflowCount ?? 0) : 0)

  const chipsBlock = hasChips ? (
    <div className="space-y-1 pt-0.5">
      {chipsSectionLabelT ? (
        <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted">
          {chipsSectionLabelT}
        </p>
      ) : null}
      <div
        className={cn(
          'flex min-w-0 gap-1.5',
          isGrid ? 'flex-nowrap items-center overflow-hidden' : 'flex-wrap items-center',
        )}
      >
        {visibleChips.map(({ id: chipId, label, kind }) =>
          kind === 'group' || kind === 'service' ? (
            <StudioLabeledMetaChip
              key={chipId}
              kind={kind}
              name={label}
              className={isGrid ? 'max-w-[11rem] truncate' : 'max-w-full'}
            />
          ) : (
            <span key={chipId} className={cn(studioListCardChip, isGrid && 'max-w-[9rem] truncate')}>
              {label}
            </span>
          ),
        )}
        {isGrid && gridMoreCount > 0 && overflowLabel ? (
          <span className="shrink-0 text-[0.7rem] text-muted">{overflowLabel}</span>
        ) : null}
        {!isGrid && showOverflow ? (
          <span className="w-fit shrink-0 text-[0.7rem] text-muted">{overflowLabel}</span>
        ) : null}
      </div>
    </div>
  ) : tagsT ? (
    <p className="truncate pt-0.5 text-xs text-muted">{tagsT}</p>
  ) : null

  return (
    <div
      className={cn(
        studioSortableListCard,
        isGrid ? 'h-full flex-col overflow-hidden' : 'flex-col gap-2 lg:flex-row lg:items-stretch',
      )}
    >
      {topEndAdornment ? (
        <div className="pointer-events-none absolute top-3 right-10 z-10">
          <div className="pointer-events-auto">{topEndAdornment}</div>
        </div>
      ) : null}

      <div
        className={cn(
          'flex min-w-0 flex-1',
          isGrid ? 'flex-col' : 'flex-col gap-2 lg:flex-row lg:items-center',
        )}
      >
        {!isGrid ? (
          <div className="hidden shrink-0 items-center text-muted lg:flex">{dragHandle}</div>
        ) : null}
        <Link
          href={href}
          className={cn(
            'min-w-0 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring',
            isGrid
              ? 'flex w-full flex-1 flex-col gap-2'
              : 'flex w-full min-w-0 flex-1 cursor-pointer flex-col gap-2 lg:flex-row lg:items-center lg:gap-3',
          )}
        >
          {thumbnailUrl ? (
            <div className={isGrid ? studioListCardThumbGrid : studioListCardThumb}>
              <Image
                src={thumbnailUrl}
                alt=""
                fill
                className="object-cover"
                sizes={
                  isGrid
                    ? '(max-width: 640px) 50vw, 480px'
                    : '(max-width: 1024px) 100vw, 116px'
                }
                unoptimized
              />
            </div>
          ) : null}
          <div
            className={cn(
              'min-w-0 flex-1 space-y-1.5',
              isGrid ? 'pr-9' : topEndAdornment ? 'lg:pr-12' : undefined,
            )}
          >
            {eyebrowT ? (
              <p className="truncate text-[0.65rem] font-medium uppercase tracking-wider text-muted">
                {eyebrowT}
              </p>
            ) : null}
            <div className="flex min-w-0 items-center gap-2">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex min-w-0 items-center gap-x-2">
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                    {title}
                  </p>
                  {!isGrid ? titleEndAdornment : null}
                </div>
                {subtitleT ? <p className="truncate text-xs text-muted">{subtitleT}</p> : null}
              </div>
              {!isGrid ? (
                <CardOverflowMenu
                  menuItems={menuItems}
                  menuTriggerAriaLabel={menuTriggerAriaLabel}
                  className="lg:hidden"
                />
              ) : null}
              {isGrid ? <div className="shrink-0">{titleEndAdornment}</div> : null}
            </div>
            {descriptionT ? (
              <p className="line-clamp-2 text-sm leading-snug text-muted">{descriptionT}</p>
            ) : null}
            {metaText && MetaIcon ? (
              <p className="flex min-w-0 items-start gap-1 text-xs text-muted">
                <MetaIcon size={12} className="mt-0.5 shrink-0 text-foreground/70" aria-hidden />
                <span className="min-w-0 truncate">{metaText}</span>
              </p>
            ) : null}
            {footerT ? (
              <p className="truncate text-xs leading-snug text-muted tabular-nums">{footerT}</p>
            ) : null}
            {chipsBlock}
          </div>
        </Link>
      </div>

      <CardOverflowMenu
        menuItems={menuItems}
        menuTriggerAriaLabel={menuTriggerAriaLabel}
        className={cn(
          isGrid ? 'absolute top-2.5 right-2' : 'hidden lg:flex lg:items-center lg:self-center',
        )}
      />
    </div>
  )
}
