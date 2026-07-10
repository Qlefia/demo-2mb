/**
 * Horizontal frame shared with `Container` — max width, centering, and side padding
 * from `globals.css` (`--page-max-width`, `--page-padding`). Use in the dashboard
 * header (and similar toolbars) so the logo and page body share one left edge.
 */
export const PAGE_FRAME_CLASS =
  'mx-auto w-full max-w-[var(--page-max-width)] px-[var(--page-padding)]'

/** Vertical stack rhythm — 1.25rem mobile/tablet, 1.5rem desktop. */
export const PAGE_SECTION_STACK = 'flex flex-col gap-[var(--page-section-gap)]'

/** Dashboard app header bar — taller on mobile/tablet for touch targets. */
export const DASHBOARD_HEADER_BAR_CLASS =
  'flex h-14 max-lg:h-16 items-center justify-between gap-[var(--page-section-gap)]'
