import { cn } from '@/lib/cn'

/** Primary CTA link at the bottom of Companies / Calendar side panels. */
export const CRM_DETAIL_PANEL_CTA_CLASS =
  'mt-4 flex items-center justify-between rounded-[var(--form-field-radius)] border border-border bg-foreground p-3 text-sm font-medium text-background outline-none transition-opacity hover:opacity-90 focus-visible:outline-none'

/** Tap-outside scrim for mobile CRM detail sheets (Companies kanban, Calendar). */
export const CRM_DETAIL_PANEL_MOBILE_SCRIM_CLASS =
  'fixed inset-0 z-40 bg-[color:var(--ui-scrim)] lg:hidden'

/** Side panel: fixed bottom sheet on mobile, inline rail on lg+. */
export const CRM_DETAIL_PANEL_ASIDE_CLASS = cn(
  'flex flex-col border-border bg-background',
  'fixed inset-x-0 bottom-0 z-50 max-h-[calc(100dvh-4.5rem-env(safe-area-inset-bottom,0px))] w-full rounded-t-lg border-t shadow-lg',
  'lg:static lg:max-h-none lg:h-full lg:w-96 lg:min-h-0 lg:shrink-0 lg:rounded-none lg:border-l lg:border-t-0 lg:shadow-none lg:overflow-hidden',
)

