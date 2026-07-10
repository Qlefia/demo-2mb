'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import {
  studioSettingsContentGutter,
  studioSettingsInnerTop,
  studioSettingsListScroll,
  studioSettingsMainBody,
  studioSettingsMainColumn,
  studioSettingsMainScroll,
  studioSettingsPinnedHeader,
} from '@/features/studio-settings/studioBlockChrome'

export type StudioSettingsMainPaneVariant = 'builder' | 'list' | 'page'

type StudioSettingsMainPaneProps = {
  /** `builder` = detail + relations rail; `list` = pinned header + list scroll; `page` = optional header + form scroll. */
  variant: StudioSettingsMainPaneVariant
  /** Pinned block above scroll (Sales tabs + toolbar, General tabs, …). */
  header?: ReactNode
  children: ReactNode
  /** Extra classes on list scroll body (default `pt-2` gap under header). */
  listBodyClassName?: string
}

/** Shared main column shell for all Workspace Settings routes (matches Sales layout). */
export function StudioSettingsMainPane({
  variant,
  header,
  children,
  listBodyClassName,
}: StudioSettingsMainPaneProps) {
  return (
    <div className={studioSettingsMainColumn}>
      <div className={studioSettingsMainBody}>
        {variant === 'builder' ? (
          children
        ) : variant === 'list' ? (
          <>
            {header ? <div className={studioSettingsPinnedHeader}>{header}</div> : null}
            <div className={cn(studioSettingsListScroll, studioSettingsContentGutter, listBodyClassName ?? 'pt-2')}>
              {children}
            </div>
          </>
        ) : (
          <>
            {header ? <div className={studioSettingsPinnedHeader}>{header}</div> : null}
            <div
              className={cn(
                studioSettingsMainScroll,
                studioSettingsContentGutter,
                header ? 'pt-2' : studioSettingsInnerTop,
              )}
            >
              {children}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
