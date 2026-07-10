'use client'

import { Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { studioRadiusNested } from '@/features/studio-settings/studioBlockChrome'
import {
  isProspectPinned,
  useToggleProspectPin,
} from '@/features/dashboard/lib/useToggleProspectPin'
import { useDashboardPinsQuery } from '@/features/dashboard/lib/useDashboardPinsQuery'

interface ProspectPinButtonProps {
  prospectId: string
  className?: string
  size?: 'sm' | 'md'
}

const sizeClass = { sm: 'h-8 w-8', md: 'h-9 w-9' } as const
const iconSize = { sm: 16, md: 18 } as const

export function ProspectPinButton({ prospectId, className, size = 'sm' }: ProspectPinButtonProps) {
  const { t } = useTranslation()
  const pinsQuery = useDashboardPinsQuery(true)
  const togglePin = useToggleProspectPin()
  const isPinned = isProspectPinned(pinsQuery.data, prospectId)
  const label = isPinned ? t('homeDashboard.favorites.unpin') : t('homeDashboard.favorites.pin')

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        void togglePin.mutate(prospectId)
      }}
      disabled={togglePin.isPending}
      className={cn(
        'inline-flex shrink-0 items-center justify-center text-muted transition-colors',
        'hover:bg-foreground/[0.07] hover:text-foreground dark:hover:bg-white/[0.08]',
        'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-60',
        studioRadiusNested,
        sizeClass[size],
        isPinned && 'text-accent',
        className,
      )}
      aria-label={label}
      title={label}
    >
      <Star
        size={iconSize[size]}
        strokeWidth={1.5}
        fill={isPinned ? 'currentColor' : 'none'}
        aria-hidden
      />
    </button>
  )
}
