/** Shared pill styles for residential project cards. */
export const projectChipBase =
  'inline-flex h-6 shrink-0 items-center justify-center rounded-full px-2.5 text-xs font-medium leading-none'

export const projectChipPrimary = `${projectChipBase} bg-primary text-primary-foreground`
export const projectChipSurface = `${projectChipBase} bg-background/90 text-foreground backdrop-blur-sm`
export const projectChipMuted = `${projectChipBase} bg-muted/60 text-foreground`

/** Toolbar control height — matches SearchInput (`h-9`). */
export const projectToolbarControlClass =
  '[&_button]:h-9 [&_button]:min-w-0 [&_button_span]:truncate'
