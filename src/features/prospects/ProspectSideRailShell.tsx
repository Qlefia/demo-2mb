'use client'

import { useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Maximize2, Minimize2, X } from 'lucide-react'
import { IconButton } from '@/components/atoms'
import { cn } from '@/lib/cn'
import {
  studioRelationsRailAside,
  studioRelationsRailPanel,
} from '@/features/studio-settings/studioBlockChrome'

type ProspectSideRailShellProps = {
  side: 'left' | 'right'
  panelId: string
  ariaLabel: string
  open: boolean
  onOpenChange: (open: boolean) => void
  fullscreen: boolean
  onFullscreenChange: (fullscreen: boolean) => void
  children: ReactNode
  className?: string
}

export function ProspectSideRailShell({
  side,
  panelId,
  ariaLabel,
  open,
  onOpenChange,
  fullscreen,
  onFullscreenChange,
  children,
  className,
}: ProspectSideRailShellProps) {
  const { t } = useTranslation()

  const close = () => {
    onOpenChange(false)
    onFullscreenChange(false)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (fullscreen) {
        onFullscreenChange(false)
        return
      }
      onOpenChange(false)
      onFullscreenChange(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, fullscreen, onOpenChange, onFullscreenChange])

  useEffect(() => {
    if (!open) onFullscreenChange(false)
  }, [open, onFullscreenChange])

  const edgeSlideClass =
    side === 'left'
      ? 'max-lg:inset-y-0 max-lg:left-0 max-lg:border-r max-lg:border-l-0'
      : 'max-lg:inset-y-0 max-lg:right-0 max-lg:border-l max-lg:border-r-0'

  const desktopBorderClass = side === 'left' ? 'lg:border-r lg:border-l-0' : 'lg:border-l'

  return (
    <>
      {open && !fullscreen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          aria-label={t('prospects.workspace.mobileRail.closePanel')}
          onClick={close}
        />
      ) : null}

      <aside
        id={panelId}
        aria-label={ariaLabel}
        className={cn(
          studioRelationsRailAside,
          desktopBorderClass,
          !open && 'max-lg:hidden',
          open && 'max-lg:fixed max-lg:z-50 max-lg:flex max-lg:shadow-lg',
          open && !fullscreen && cn(edgeSlideClass, 'max-lg:w-full max-lg:max-w-md max-lg:border-t-0'),
          open && fullscreen && 'max-lg:inset-0 max-lg:w-full max-lg:max-w-none max-lg:border-0',
          className,
        )}
      >
        <div className={cn(studioRelationsRailPanel, open && 'max-lg:flex max-lg:flex-1')}>
          {open ? (
            <div className="flex shrink-0 items-center justify-end gap-0.5 border-b border-border px-2 py-1.5 lg:hidden">
              <IconButton
                icon={fullscreen ? Minimize2 : Maximize2}
                size="xs"
                label={fullscreen ? t('builder.exitFullscreen') : t('builder.fullscreenPanel')}
                onClick={() => onFullscreenChange(!fullscreen)}
              />
              <IconButton
                icon={X}
                size="xs"
                label={t('prospects.workspace.mobileRail.closePanel')}
                onClick={close}
              />
            </div>
          ) : null}
          {children}
        </div>
      </aside>
    </>
  )
}
