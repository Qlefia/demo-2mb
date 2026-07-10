import { cn } from '@/lib/cn'

/** Shared Headless UI tab surface styles (Swiss-minimal, no shadow). */
export const tabListBorderClass = 'flex gap-0 border-b border-border'

/** Studio General / Sales section tabs — horizontal scroll on mobile, wrapped row on `lg+`. */
export const tabListSectionNavClass =
  'flex min-w-0 flex-nowrap gap-x-4 overflow-x-auto overscroll-x-contain lg:flex-wrap lg:gap-x-6 lg:overflow-visible'

/** Horizontal tab row shell (studio General / Sales); keeps triggers above scrolling content. */
export const tabNavScrollShellClass =
  'relative z-20 -mx-1 overflow-x-auto overscroll-x-contain px-1'

/** Tab row inside {@link studioSettingsMainPad} — no negative margin (prevents horizontal jump). */
export const tabNavScrollShellInsetClass =
  'relative z-20 overflow-x-auto overscroll-x-contain'

/** Studio section tabs — fixed row, no horizontal scroll. */
export const tabNavShellStaticClass = 'relative z-20 shrink-0'

/** Section tab triggers: gutter is on the column; triggers only add vertical pad. */
export const tabTriggerSectionClass =
  'box-border cursor-pointer select-none border-b-2 border-transparent px-0 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground outline-none focus:outline-none data-selected:border-primary data-selected:text-foreground'

/** Centered icon row for workspace tool rails (prospect right column, Storybook). */
export const tabListIconToolRailClass = cn(
  tabListBorderClass,
  'items-center justify-center gap-1 bg-background px-0.5 py-2',
)

export const tabTriggerClass =
  'box-border cursor-pointer select-none border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground outline-none focus:outline-none data-selected:border-primary data-selected:text-foreground'

/** Square icon trigger: inactive = transparent border (no layout shift), selected = light frame + tint. */
export const tabTriggerIconClass =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-transparent text-muted outline-none transition-colors focus:outline-none hover:text-foreground data-selected:border-border data-selected:bg-primary/5 data-selected:text-foreground'

/** Left-aligned compact icon rail (Proscus builder, studio relations sidebar). */
export const tabListStudioRelationsRailClass = cn(
  tabListBorderClass,
  'shrink-0 items-center justify-start gap-1 bg-background px-3 pb-2 pt-2',
)

export const tabTriggerStudioRelationsClass =
  'shrink-0 rounded p-1.5 text-muted outline-none transition-colors hover:bg-muted/30 hover:text-foreground focus:outline-none data-selected:bg-muted/50 data-selected:text-foreground'

/** Segmented control shell (studio image/video toggle). */
export const tabListSegmentedShellClass =
  'inline-flex h-7 shrink-0 items-center gap-0.5 rounded-[var(--form-field-radius)] bg-foreground/[0.04] p-0.5 dark:bg-white/[0.05]'

export const tabListSegmentedClass = 'flex gap-0.5'

export const tabTriggerSegmentedClass =
  'rounded-[var(--form-field-radius)] px-2.5 py-0.5 text-xs font-medium text-muted outline-none transition-colors hover:bg-foreground/10 hover:text-foreground focus:outline-none focus-visible:outline-none data-selected:bg-foreground data-selected:text-background'

/** Pill tab row (avatar type picker). */
export const tabListPillShellClass =
  'inline-flex flex-wrap gap-0.5 rounded-sm border border-border bg-foreground/3 p-0.5 dark:bg-white/5'

export const tabTriggerPillClass =
  'rounded-sm px-2.5 py-1.5 text-xs font-medium text-muted outline-none transition-colors hover:text-foreground focus:outline-none focus-visible:outline-none data-selected:bg-background data-selected:text-foreground data-selected:shadow-sm disabled:cursor-default disabled:opacity-100'
