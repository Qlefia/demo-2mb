import { cn } from '@/lib/cn'
import { tabListStudioRelationsRailClass } from '@/components/molecules/Tabs/tabListStyles'
import {
  studioRelationsRailTabPanel,
  studioRelationsTabPanels,
  studioSettingsRailBodyTop,
} from '@/features/studio-settings/studioBlockChrome'

/** Tab icon row — matches {@link StudioRelationsSidebar}. */
export const prospectSideRailTabListShell =
  'flex shrink-0 items-center gap-1 border-b border-border bg-background'

export const prospectSideRailTabListClass = cn(tabListStudioRelationsRailClass, 'min-w-0 flex-1 border-b-0')

export const prospectSideRailTabPanelsClass = cn(studioRelationsTabPanels, 'min-h-0 flex-1')

/** Scrollable tab body — left-aligned, full width, same inset as studio relations rail. */
export const prospectSideRailTabPanelClass = cn(
  studioRelationsRailTabPanel,
  'px-3 pb-3',
  studioSettingsRailBodyTop,
  'overflow-y-auto overscroll-contain focus:outline-none',
)

/** Inner stack for forms / lists inside a side-rail tab. */
export const prospectSideRailPanelBody = 'flex w-full min-w-0 flex-col gap-3'
