/**
 * Studio settings surfaces — shared tint, spacing, and corner radius.
 *
 * Radius scale (use composites below, not ad-hoc rounded-sm/md in studio-settings/):
 * - Block surfaces (cards, panels, add row, collapsible shell): rounded-xl
 * - Nested inside a block (thumbnails, compact rows): rounded-lg
 * - Pills / chips: rounded-full
 * - Compact toolbar controls (rich-text, segment toggles): rounded-lg
 */

/** Label → control → hint (inner rhythm). */
export const studioFieldStack = 'studio-field-stack'

/** Chips / tight inline groups (inner). */
export const studioChipCluster = 'studio-chip-cluster'

/** Title, search, chip cloud, footnote (block rhythm). */
export const studioBlockStack = 'studio-block-stack'

/** Major panels in a settings page (section rhythm). */
export const studioSectionStack = 'studio-section-stack'

/** Block-level corners — list cards, editor panels, add row, section shells. */
export const studioRadiusBlock = 'rounded-[var(--form-field-radius)]'
export const studioRadiusBlockTop = 'rounded-t-[var(--form-field-radius)]'
export const studioRadiusBlockBottom = 'rounded-b-[var(--form-field-radius)]'

/** Nested media / chips inside a block. */
export const studioRadiusNested = 'rounded-lg'

/** Compact controls (rich-text toolbar, image/video toggle). */
export const studioRadiusControl = 'rounded-lg'

/** Draggable summary card (groups, best works list) — tint only, no border. */
export const studioSortableListCard = `relative flex w-full min-w-0 items-stretch gap-2 ${studioRadiusBlock} bg-foreground/[0.04] p-3 transition-colors hover:bg-foreground/[0.07] dark:bg-white/[0.05] dark:hover:bg-white/[0.08]`

/** Full-width “add row” under sortable lists. */
/** Compact gold accent add control (toolbars, pickers). */
export const studioAccentAddButtonCompact =
  'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-sm bg-accent px-3 text-xs font-medium text-white outline-none transition-colors hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

/** Full-width accent add row at list footers. */
export const studioAccentAddButtonBlock = `flex w-full min-h-10 items-center justify-center gap-2 ${studioRadiusBlock} bg-accent px-4 text-sm font-medium text-white outline-none transition-colors hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background`

/** @deprecated Use {@link studioAccentAddButtonBlock}. */
export const studioListAddButton = studioAccentAddButtonBlock

/** Secondary navigation / back actions in studio editors (intrinsic width in section stacks). */
export const studioGhostAction = `inline-flex h-10 w-fit self-start items-center justify-center ${studioRadiusBlock} bg-foreground/[0.04] px-4 text-sm font-medium text-foreground transition-colors hover:bg-foreground/[0.07] dark:bg-white/[0.05] dark:hover:bg-white/[0.08]`

/** Full-width secondary block action (mailto, save note, narrow rails). */
export const studioGhostActionBlock = `flex w-full min-h-10 items-center justify-center gap-2 ${studioRadiusBlock} bg-foreground/[0.04] px-4 text-sm font-medium text-foreground outline-none transition-colors hover:bg-foreground/[0.07] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/[0.05] dark:hover:bg-white/[0.08]`

/** Compact back + title on Sales detail editors (groups, catalogue, works, reviews, segments). */
export const studioSalesDetailHeaderBar = `mb-1.5 flex min-w-0 items-center gap-1.5 ${studioRadiusBlock} bg-foreground/[0.04] px-2 py-1 dark:bg-white/[0.05]`

/** Back control inside {@link studioSalesDetailHeaderBar}. */
export const studioSalesDetailHeaderBack = `inline-flex h-7 w-7 shrink-0 items-center justify-center text-muted transition-colors hover:bg-foreground/[0.07] hover:text-foreground dark:hover:bg-white/[0.08] ${studioRadiusNested}`

/** Title text inside {@link studioSalesDetailHeaderBar}. */
export const studioSalesDetailHeaderTitle =
  'min-w-0 flex-1 truncate text-xs font-semibold leading-tight text-foreground sm:text-sm'

/** @deprecated Use {@link studioSalesDetailHeaderBar}. */
export const studioWorkDetailStickyBar = `${studioSalesDetailHeaderBar} flex-wrap gap-x-3 gap-y-1 py-1.5`

/** Space between draggable summary cards. */
export const studioSortableStack = 'grid gap-2'

/** Space between compact draggable rows (group members). */
export const studioSortableStackCompact = 'grid gap-1'

/** Rich editor shell (inline catalog line, segment, review workspace). */
export const studioEditorPanel = `min-w-0 flex-1 ${studioRadiusBlock} bg-foreground/[0.04] p-[var(--studio-workspace-padding)] dark:bg-white/[0.05] [&_.survey-brand-input]:bg-background dark:[&_.survey-brand-input]:bg-background`

/**
 * Grey editor panel + vertical blocks (title → media → description → links).
 * gap-7 = 1.75rem — editor sections (tighter than gap-8).
 */
export const studioEditorPanelBody = `${studioEditorPanel} flex flex-col gap-7`

/** Up to three field stacks per row (author lines, optional display lines). */
export const studioEditorFieldsRow = 'grid gap-[var(--studio-stack-block-gap)] sm:grid-cols-3'

/** Field groups inside a workspace card. */
export const studioWorkspaceBody = 'studio-workspace-body'

/** Stack of workspace cards (catalogue lines, etc.). */
export const studioWorkspaceList = 'studio-workspace-list'

/** Separates overview chips from the editable workspace list. */
export const studioWorkspaceZone = 'studio-workspace-zone'

/** Compact picker row — same tint as {@link studioSortableListCard}, no border. */
export const studioMemberRow = `${studioSortableListCard} items-center`

/** Selected state for catalogue picker rows (tint only, no ring). */
export const studioMemberRowSelected =
  'bg-primary/[0.06] hover:bg-primary/[0.08] dark:bg-primary/10 dark:hover:bg-primary/10'

/** Scrollable catalog picker. */
export const studioCatalogPicker = `max-h-64 space-y-0.5 overflow-y-auto ${studioRadiusBlock} bg-foreground/[0.03] p-1.5 md:max-h-96 dark:bg-white/[0.04]`

/** Studio settings — full-width tab strip on mobile; fixed column from `lg`. */
export const studioSettingsNavColumn =
  'w-full min-w-0 shrink-0 lg:w-80 lg:min-w-80 lg:max-w-80'

/** Primary nav list: horizontal scroll on mobile, column on desktop (Proscus settings sidebar). */
export const studioSettingsNavList =
  'flex flex-nowrap gap-1 overflow-x-auto overscroll-x-contain pb-1 lg:flex-col lg:overflow-visible lg:pb-0'

export const studioSettingsNavItem = 'shrink-0 lg:w-full lg:min-w-0'

export const studioSettingsNavLink = 'flex shrink-0 items-center gap-2 whitespace-nowrap lg:w-full'

/**
 * Single horizontal gutter for main column (tab left edge, search, cards).
 * Matches left nav {@link studioSettingsNavGutter} inset from the divider.
 */
export const studioSettingsContentGutter = 'px-4'

/** @deprecated Use {@link studioSettingsContentGutter}. */
export const studioSettingsMainPad = studioSettingsContentGutter

/** Left nav list inset — symmetric to `border-r` (matches {@link studioSettingsContentGutter}). */
export const studioSettingsNavGutter = 'px-4'

/**
 * Inner top inset — matches {@link studioSettingsSubNavBottom} / tab row `pb-2` under the line.
 * Dividers stay flush (outer); content does not (inner).
 */
export const studioSettingsInnerTop = 'pt-2'

/** Space under Sales / General horizontal tab row (above list or toolbar). */
export const studioSettingsSubNavBottom = 'pb-2'

/** Detail editor scroll column (horizontal + inner top). */
export const studioSettingsDetailPad = `${studioSettingsMainPad} ${studioSettingsInnerTop}`

/** Space below relations rail icon row divider (search / list). */
export const studioSettingsRailBodyTop = 'pt-2'

/** Pinned header row (Sales sub-nav, General tabs, etc.). */
export const studioSettingsListHeader = 'shrink-0 bg-background'

/** Composed classes for a pinned studio main-column header. */
export const studioSettingsPinnedHeader = [
  studioSettingsListHeader,
  'min-w-0',
  studioSettingsContentGutter,
  studioSettingsInnerTop,
  studioSettingsSubNavBottom,
].join(' ')

/** Scrollable Sales list body (groups, services, works, reviews). */
export const studioSettingsListScroll =
  'min-h-0 flex-1 overflow-y-auto overscroll-contain pb-3'

/** Single scroll region for General / detail editor column. */
export const studioSettingsMainScroll =
  'min-h-0 flex-1 overflow-y-auto overscroll-contain pb-3'

/** Flex slot that hosts {@link studioSettingsMainScroll} (list) or detail builder. */
export const studioSettingsMainBody =
  'flex min-h-0 flex-1 flex-col overflow-hidden'

/** Full-height Sales / builder row (nav | main [| rail]). */
export const studioSettingsShellRow =
  'flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row lg:gap-0'

/** Main column in studio shell (tabs + content). */
export const studioSettingsMainColumn =
  'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'

/** Relations sidebar — desktop inline rail (mobile uses off-canvas panel). */
export const studioRelationsRailAside =
  'hidden min-h-0 w-80 min-w-80 max-w-80 shrink-0 flex-col overflow-hidden border-l border-border bg-background lg:flex'

/** Collapsed mobile affordance to open the relations panel. */
export const studioRelationsRailMobileTrigger =
  'shrink-0 border-t border-border bg-background lg:hidden'

export const studioRelationsRailMobileTriggerButton =
  'flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-hover active:bg-primary/10'

export const studioRelationsRailPanel = 'flex min-h-0 flex-1 flex-col overflow-hidden focus:outline-none'

/** TabPanels host — active panel is absolutely positioned to fill height. */
export const studioRelationsTabPanels = 'relative flex min-h-0 flex-1 flex-col overflow-hidden'

/** Single relations tab — stacked panels share the same inset. */
export const studioRelationsRailTabPanel =
  'absolute inset-0 flex min-h-0 flex-col overflow-hidden focus:outline-none'

/** Direct child of a relations tab (list pickers, scroll forms). */
export const studioRelationsRailTabBody = 'flex min-h-0 flex-1 flex-col overflow-hidden'

/** Scrollable list region inside relations rail (no outer border). */
export const studioRelationListFrame = 'flex min-h-0 flex-1 flex-col overflow-hidden'

export const studioRelationListScroll = 'min-h-0 flex-1 overflow-y-auto overscroll-contain'

/** Relations rail row — same tint + radius as {@link studioMemberRow} (catalogue / works pickers). */
export const studioMemberRowRail = `flex w-full min-w-0 items-center gap-1.5 border border-border/55 ${studioRadiusNested} bg-foreground/[0.04] px-2 py-1.5 transition-colors hover:bg-foreground/[0.07] dark:border-border/70 dark:bg-white/[0.05] dark:hover:bg-white/[0.08]`

export const studioMemberRowRailSelected =
  'bg-primary/[0.06] hover:bg-primary/[0.08] dark:bg-primary/10 dark:hover:bg-primary/10'

/** Horizontal + portrait uploads — matched height, 1.25rem gap, content width only. */
export const studioDualImageUploadGrid = 'flex w-fit max-w-full flex-wrap items-end gap-[0.625rem]'

/** Scrollable stack of {@link studioMemberRowRail} rows. */
export const studioRelationMemberList = 'flex flex-col gap-1 px-1.5 pb-1'

/** Expanded detail block under a relations rail row. */
export const studioRelationRailDetailsPanel =
  'w-full space-y-1 border-t border-border/60 px-2 pb-2 pt-1.5 text-left text-[10px] leading-snug text-muted dark:border-border/75'

/** Thumbnail in relations rail work rows. */
export const studioRelationMemberThumb = `h-9 w-12 shrink-0 overflow-hidden ${studioRadiusNested} bg-muted/40 object-cover`

/** Right-aligned type pill on relation rows (Proscus question type). */
export const studioRelationTypeTag =
  'max-w-[5.5rem] shrink-0 truncate text-right text-[10px] font-medium capitalize text-muted'

/** Catalog overview block above the line list. */
export const studioCatalogOverviewShell = `space-y-2 ${studioRadiusBlock} bg-foreground/[0.03] p-3 dark:bg-white/[0.04]`

export const studioCatalogOverviewScroll = `max-h-40 overflow-y-auto ${studioRadiusNested} bg-foreground/[0.04] p-2 dark:bg-white/[0.05]`

export const studioCatalogOverviewChip =
  'max-w-full truncate rounded-full bg-foreground/[0.06] px-2.5 py-1 text-left text-xs text-foreground transition-colors hover:bg-foreground/[0.1] dark:bg-white/[0.08] dark:hover:bg-white/[0.12]'

/** Thumbnail on sortable list cards — 16:9 on mobile/tablet; fixed strip from lg. */
export const studioListCardThumb = `relative aspect-[16/9] w-full shrink-0 overflow-hidden ${studioRadiusNested} bg-foreground/[0.06] lg:aspect-auto lg:h-[5.25rem] lg:w-[7.25rem] dark:bg-white/[0.08]`

/** Thumbnail in Sales grid / card view — 4:3 frame, full card width, object-cover inside. */
export const studioListCardThumbGrid = `relative aspect-[4/3] w-full shrink-0 overflow-hidden ${studioRadiusNested} bg-foreground/[0.06] dark:bg-white/[0.08]`

/** Inline chip on list cards — w-fit so flex-wrap can pack multiple per row. */
export const studioListCardChip = `inline-flex max-w-full min-w-0 w-fit items-center wrap-break-word ${studioRadiusNested} bg-foreground/[0.06] px-2 py-0.5 text-[0.7rem] font-medium text-foreground/90 dark:bg-white/[0.08]`

/** Video / banner preview frame. */
export const studioMediaFrame = `overflow-hidden ${studioRadiusBlock} bg-foreground/[0.04] dark:bg-white/[0.05]`

export const studioVideoPreviewFrame = `relative aspect-video max-h-48 w-full max-w-xl overflow-hidden ${studioRadiusBlock} bg-[color:var(--ui-video-matte)]`

export const studioVideoPreviewInline = `overflow-hidden ${studioRadiusBlock} bg-[color:var(--ui-video-matte)]`

/** Image / video mode toggle (banner, testimonial media). */
export const studioSegmentedControl = `inline-flex h-7 shrink-0 items-center gap-0.5 ${studioRadiusControl} bg-foreground/[0.04] p-0.5 dark:bg-white/[0.05]`

export const studioSegmentedControlTab = `${studioRadiusControl} px-2.5 py-0.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1`

export const studioRichTextEditorShell = `rounded-[var(--form-field-radius)] border border-input bg-background`

export const studioRichTextToolbarShell = `mb-1 h-9 ${studioRadiusControl} bg-foreground/[0.04] dark:bg-white/[0.05]`

export const studioRichTextToolbarButton = `inline-flex h-8 w-8 shrink-0 items-center justify-center ${studioRadiusControl} text-muted transition-colors hover:bg-hover hover:text-foreground disabled:pointer-events-none disabled:opacity-35`

export const studioSideNavItem = `${studioRadiusNested} px-3 py-2 text-sm transition-colors`

/** Tint panel for nested form blocks (brands, offices, review rows). */
export const studioTintPanel = `${studioRadiusBlock} bg-foreground/[0.04] p-3 dark:bg-white/[0.05] sm:p-4`

/** Section title — matches StudioFlatSection / proposal boilerplate headings. */
export const studioSectionTitleClass = 'text-lg font-semibold tracking-tight text-foreground'

/** Collapsible section shell (legacy combined Services view). */
export const studioCollapsibleShell = `${studioRadiusBlock} border border-border bg-foreground/4 dark:bg-white/5`

/** Major section break under Services (lighter hairline). */
export const studioSectionBreak = 'mt-1 space-y-2 border-t border-border/15 pt-5'
