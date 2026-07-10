/** Parent must set `@container` (see SectionShell). */

/** Three sibling tag fields: stack → 2 cols → 3 cols as panel widens. */
export const dossierTagTripleRow =
  'grid grid-cols-1 items-start gap-3 @md:grid-cols-2 @3xl:grid-cols-3'

/** Two related fields (e.g. paired text areas). */
export const dossierFieldPair = 'grid grid-cols-1 items-start gap-3 @md:grid-cols-2'

/** Three compact inline inputs (URL, date, type). */
export const dossierInlineTriple = 'grid grid-cols-1 items-start gap-3 @md:grid-cols-3'

/** Gray tinted field surface — matches CRM stacked fields / studio sidebar. */
export const dossierFieldSurface =
  'survey-brand-input border border-input bg-foreground/[0.04] dark:bg-white/[0.05]'
