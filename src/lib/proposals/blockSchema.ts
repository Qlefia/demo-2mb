import { z } from 'zod'
import { DECK_THEME_FALLBACK, HEX_COLOR } from '@/lib/proposals/deckTheme'

/** Stable block instance id (uuid string). */
export const blockIdSchema = z.string().min(8).max(80)

export const COVER_FIELD_IDS = [
  'dateLabel',
  'headline',
  'subtitle',
  'clientCompany',
  'contactName',
  'contactRole',
  'contactEmail',
  'heroImageUrl',
  'clientLogoUrl',
] as const

export type CoverFieldId = (typeof COVER_FIELD_IDS)[number]

const hexColorSchema = z.string().regex(HEX_COLOR)

export const proposalDeckThemeSchema = z.object({
  bg: hexColorSchema,
  fg: hexColorSchema,
  muted: hexColorSchema,
  accent: hexColorSchema,
  line: hexColorSchema,
  surface: hexColorSchema,
  surfaceTint: hexColorSchema,
  tagChipBg: hexColorSchema,
  letterheadBg: hexColorSchema,
  letterheadFg: hexColorSchema,
  letterheadMuted: hexColorSchema,
  letterheadLine: hexColorSchema,
})

export type ProposalDeckThemeProps = z.infer<typeof proposalDeckThemeSchema>

const coverFieldIdSchema = z.enum([
  'dateLabel',
  'headline',
  'subtitle',
  'clientCompany',
  'contactName',
  'contactRole',
  'contactEmail',
  'heroImageUrl',
  'clientLogoUrl',
])

export function normalizeCoverFieldOrder(order: unknown): CoverFieldId[] {
  const fallback: CoverFieldId[] = [...COVER_FIELD_IDS]
  if (!Array.isArray(order)) return fallback
  const allowed = new Set<string>(COVER_FIELD_IDS as unknown as string[])
  const seen = new Set<string>()
  const out: CoverFieldId[] = []
  for (const x of order) {
    if (typeof x !== 'string' || !allowed.has(x) || seen.has(x)) continue
    seen.add(x)
    out.push(x as CoverFieldId)
  }
  for (const id of COVER_FIELD_IDS) {
    if (!seen.has(id)) out.push(id)
  }
  return out.length === COVER_FIELD_IDS.length ? out : fallback
}

const coverProps = z
  .object({
    headline: z.string().default(''),
    subtitle: z.string().default(''),
    dateLabel: z.string().default(''),
    clientCompany: z.string().default(''),
    contactName: z.string().default(''),
    contactRole: z.string().default(''),
    contactEmail: z.string().default(''),
    documentKindLine: z.string().default(''),
    issuedLine: z.string().default(''),
    validLine: z.string().default(''),
    senderBlock: z.string().default(''),
    recipientBlock: z.string().default(''),
    letterheadSurface: z.enum(['dark', 'light']).default('dark'),
    heroImageUrl: z.string().nullable().optional(),
    clientLogoUrl: z.string().nullable().optional(),
    /** Primary studio logo from brand kit (deck header + PDF). */
    studioLogoUrl: z.string().nullable().optional(),
    /** Full deck palette from Brand kit → Colors (snapshotted on merge). */
    deckTheme: proposalDeckThemeSchema.optional().nullable(),
    /** @deprecated Use `deckTheme.accent` — kept for legacy rows. */
    deckAccentColor: z.string().max(7).optional(),
    fieldOrder: z.array(coverFieldIdSchema).optional(),
  })
  .transform((data) => {
    let deckTheme = data.deckTheme ?? undefined
    const legacyAccent = data.deckAccentColor?.trim()
    if (!deckTheme && legacyAccent && HEX_COLOR.test(legacyAccent)) {
      deckTheme = { ...DECK_THEME_FALLBACK, accent: legacyAccent.toUpperCase() }
    }
    return {
      ...data,
      deckTheme,
      fieldOrder: normalizeCoverFieldOrder(data.fieldOrder),
    }
  })

const aboutKpiPairSchema = z.object({
  label: z.string(),
  value: z.string(),
})

/** Migrates legacy `kpi1*`…`kpi3*` props to `kpis[]`. */
function normalizeAboutProps(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw
  const o = raw as Record<string, unknown>
  if (Array.isArray(o.kpis)) {
    if (o.kpis.length === 0) {
      return {
        title: String(o.title ?? ''),
        body: String(o.body ?? ''),
        kpis: [{ label: '', value: '' }],
      }
    }
    return raw
  }
  if ('kpi1Label' in o || 'kpi1Value' in o || 'kpi2Label' in o) {
    return {
      title: String(o.title ?? ''),
      body: String(o.body ?? ''),
      kpis: [
        { label: String(o.kpi1Label ?? ''), value: String(o.kpi1Value ?? '') },
        { label: String(o.kpi2Label ?? ''), value: String(o.kpi2Value ?? '') },
        { label: String(o.kpi3Label ?? ''), value: String(o.kpi3Value ?? '') },
      ],
    }
  }
  return {
    title: String(o.title ?? ''),
    body: String(o.body ?? ''),
    kpis: [{ label: '', value: '' }],
  }
}

export const ABOUT_FIELD_IDS = ['title', 'body', 'kpis'] as const

export type AboutFieldId = (typeof ABOUT_FIELD_IDS)[number]

const aboutFieldIdSchema = z.enum(['title', 'body', 'kpis'])

export function normalizeAboutFieldOrder(order: unknown): AboutFieldId[] {
  const fallback: AboutFieldId[] = [...ABOUT_FIELD_IDS]
  if (!Array.isArray(order)) return fallback
  const allowed = new Set<string>(ABOUT_FIELD_IDS as unknown as string[])
  const seen = new Set<string>()
  const out: AboutFieldId[] = []
  for (const x of order) {
    if (typeof x !== 'string' || !allowed.has(x) || seen.has(x)) continue
    seen.add(x)
    out.push(x as AboutFieldId)
  }
  for (const id of ABOUT_FIELD_IDS) {
    if (!seen.has(id)) out.push(id)
  }
  return out.length === ABOUT_FIELD_IDS.length ? out : fallback
}

const aboutProps = z.preprocess(
  normalizeAboutProps,
  z
    .object({
      title: z.string(),
      body: z.string(),
      kpis: z.array(aboutKpiPairSchema).min(1).max(24),
      fieldOrder: z.array(aboutFieldIdSchema).optional(),
    })
    .transform((data) => ({
      ...data,
      fieldOrder: normalizeAboutFieldOrder(data.fieldOrder),
    })),
)

export const WHY_US_FIELD_IDS = ['title', 'bullets'] as const

export type WhyUsFieldId = (typeof WHY_US_FIELD_IDS)[number]

const whyUsFieldIdSchema = z.enum(['title', 'bullets'])

export function normalizeWhyUsFieldOrder(order: unknown): WhyUsFieldId[] {
  const fallback: WhyUsFieldId[] = [...WHY_US_FIELD_IDS]
  if (!Array.isArray(order)) return fallback
  const allowed = new Set<string>(WHY_US_FIELD_IDS as unknown as string[])
  const seen = new Set<string>()
  const out: WhyUsFieldId[] = []
  for (const x of order) {
    if (typeof x !== 'string' || !allowed.has(x) || seen.has(x)) continue
    seen.add(x)
    out.push(x as WhyUsFieldId)
  }
  for (const id of WHY_US_FIELD_IDS) {
    if (!seen.has(id)) out.push(id)
  }
  return out.length === WHY_US_FIELD_IDS.length ? out : fallback
}

const whyUsProps = z
  .object({
    title: z.string(),
    bullets: z.array(z.string()),
    fieldOrder: z.array(whyUsFieldIdSchema).optional(),
  })
  .transform((data) => ({
    ...data,
    fieldOrder: normalizeWhyUsFieldOrder(data.fieldOrder),
  }))

const testimonialItem = z.object({
  quote: z.string(),
  name: z.string(),
  role: z.string(),
  company: z.string(),
})

const testimonialsProps = z.object({
  title: z.string(),
  items: z.array(testimonialItem).min(1),
})

const comparableCaseCard = z.object({
  name: z.string(),
  line: z.string(),
  imageUrl: z.string().nullable().optional(),
})

const comparableCasesProps = z.object({
  title: z.string(),
  cases: z.array(comparableCaseCard).min(1),
})

export const PROJECT_SCOPE_FIELD_IDS = ['title', 'bullets', 'imageUrl'] as const

export type ProjectScopeFieldId = (typeof PROJECT_SCOPE_FIELD_IDS)[number]

const projectScopeFieldIdSchema = z.enum(['title', 'bullets', 'imageUrl'])

export function normalizeProjectScopeFieldOrder(order: unknown): ProjectScopeFieldId[] {
  const fallback: ProjectScopeFieldId[] = [...PROJECT_SCOPE_FIELD_IDS]
  if (!Array.isArray(order)) return fallback
  const allowed = new Set<string>(PROJECT_SCOPE_FIELD_IDS as unknown as string[])
  const seen = new Set<string>()
  const out: ProjectScopeFieldId[] = []
  for (const x of order) {
    if (typeof x !== 'string' || !allowed.has(x) || seen.has(x)) continue
    seen.add(x)
    out.push(x as ProjectScopeFieldId)
  }
  for (const id of PROJECT_SCOPE_FIELD_IDS) {
    if (!seen.has(id)) out.push(id)
  }
  return out.length === PROJECT_SCOPE_FIELD_IDS.length ? out : fallback
}

const sectionSurfaceSchema = z.enum(['deck', 'letterhead']).optional()

const projectScopeProps = z
  .object({
    title: z.string(),
    bullets: z.array(z.string()),
    imageUrl: z.string().nullable().optional(),
    fieldOrder: z.array(projectScopeFieldIdSchema).optional(),
    sectionSurface: sectionSurfaceSchema,
  })
  .transform((data) => ({
    ...data,
    fieldOrder: normalizeProjectScopeFieldOrder(data.fieldOrder),
    sectionSurface: data.sectionSurface ?? 'deck',
  }))

const pricingRow = z.object({
  package: z.string(),
  deliverables: z.string(),
  price: z.string(),
})

const pricingProps = z
  .object({
    title: z.string(),
    rows: z.array(pricingRow).min(1),
    sectionSurface: sectionSurfaceSchema,
  })
  .transform((data) => ({
    ...data,
    sectionSurface: data.sectionSurface ?? 'deck',
  }))

const timelineProps = z
  .object({
    title: z.string(),
    milestones: z
      .array(
        z.object({
          week: z.string(),
          label: z.string(),
        }),
      )
      .min(1),
    sectionSurface: sectionSurfaceSchema,
  })
  .transform((data) => ({
    ...data,
    sectionSurface: data.sectionSurface ?? 'deck',
  }))

const termsProps = z
  .object({
    body: z.string(),
    sectionSurface: sectionSurfaceSchema,
  })
  .transform((data) => ({
    ...data,
    sectionSurface: data.sectionSurface ?? 'deck',
  }))

const visualCellSchema = z.discriminatedUnion('kind', [
  z.object({
    id: blockIdSchema,
    kind: z.literal('image'),
    imageUrl: z.string().nullable().optional(),
    /** Tall frame (3:4) vs wide frame (16:9) — affects crop preview & PDF. */
    imageAspect: z.enum(['portrait', 'landscape']).default('portrait'),
  }),
  z.object({
    id: blockIdSchema,
    kind: z.literal('text'),
    heading: z.preprocess(
      (v) => (v === undefined || v === null ? '' : String(v)),
      z.string(),
    ),
    body: z.preprocess(
      (v) => (v === undefined || v === null ? '' : String(v)),
      z.string(),
    ),
  }),
])

const visualRowSchema = z.object({
  id: blockIdSchema,
  cells: z.array(visualCellSchema).min(1).max(5),
})

export const visualGridProps = z.object({
  sectionTitle: z.string().optional(),
  rows: z.array(visualRowSchema).min(1),
})

export type VisualGridProps = z.infer<typeof visualGridProps>

const serviceMatrixRowSchema = z.object({
  id: blockIdSchema,
  label: z.string(),
  included: z.array(z.boolean()),
})

const serviceMatrixProps = z.object({
  title: z.string(),
  columnLabels: z.array(z.string()).min(1),
  rows: z.array(serviceMatrixRowSchema).min(1),
})

const videoProps = z.discriminatedUnion('source', [
  z.object({
    source: z.literal('embed'),
    title: z.string().optional(),
    embedUrl: z.string(),
  }),
  z.object({
    source: z.literal('upload'),
    title: z.string().optional(),
    filePath: z.string(),
    fileUrl: z.string(),
  }),
  z.object({
    source: z.literal('url'),
    title: z.string().optional(),
    fileUrl: z.string(),
  }),
])

const imageComparisonProps = z.object({
  beforeUrl: z.string().nullable().optional(),
  afterUrl: z.string().nullable().optional(),
  beforeLabel: z.string().optional(),
  afterLabel: z.string().optional(),
  initialSplitPercent: z.number().min(0).max(100).optional(),
})

const serviceTagEntrySchema = z.object({
  sourceId: z.string().uuid().nullable(),
  label: z.string(),
})

const serviceTagsProps = z.object({
  title: z.string(),
  entries: z.array(serviceTagEntrySchema),
})

export const proposalBlockSchema = z.discriminatedUnion('type', [
  z.object({
    id: blockIdSchema,
    type: z.literal('cover'),
    props: coverProps,
  }),
  z.object({
    id: blockIdSchema,
    type: z.literal('about_2mb'),
    props: aboutProps,
  }),
  z.object({
    id: blockIdSchema,
    type: z.literal('why_us'),
    props: whyUsProps,
  }),
  z.object({
    id: blockIdSchema,
    type: z.literal('testimonials'),
    props: testimonialsProps,
  }),
  z.object({
    id: blockIdSchema,
    type: z.literal('comparable_cases'),
    props: comparableCasesProps,
  }),
  z.object({
    id: blockIdSchema,
    type: z.literal('project_scope'),
    props: projectScopeProps,
  }),
  z.object({
    id: blockIdSchema,
    type: z.literal('pricing'),
    props: pricingProps,
  }),
  z.object({
    id: blockIdSchema,
    type: z.literal('timeline'),
    props: timelineProps,
  }),
  z.object({
    id: blockIdSchema,
    type: z.literal('terms'),
    props: termsProps,
  }),
  z.object({
    id: blockIdSchema,
    type: z.literal('visual_grid'),
    props: visualGridProps,
  }),
  z.object({
    id: blockIdSchema,
    type: z.literal('service_matrix'),
    props: serviceMatrixProps,
  }),
  z.object({
    id: blockIdSchema,
    type: z.literal('video'),
    props: videoProps,
  }),
  z.object({
    id: blockIdSchema,
    type: z.literal('image_comparison'),
    props: imageComparisonProps,
  }),
  z.object({
    id: blockIdSchema,
    type: z.literal('service_tags'),
    props: serviceTagsProps,
  }),
])

export const proposalBlocksSchema = z.array(proposalBlockSchema)

export type ProposalBlock = z.infer<typeof proposalBlockSchema>
export type ProposalBlockType = ProposalBlock['type']

export type VisualCell = z.infer<typeof visualCellSchema>
export type VisualRow = z.infer<typeof visualRowSchema>

/**
 * Flex grow per column in a visual_grid row (preview + PDF + editor).
 * Landscape image frames get roughly ~2× width vs portrait/text so panoramas are not squeezed into 50/50 splits.
 */
export function visualGridCellFlexGrow(cell: VisualCell): number {
  if (cell.kind === 'text') return 1
  return (cell.imageAspect ?? 'portrait') === 'landscape' ? 2 : 1
}

export function createEmptyBlock(type: ProposalBlockType): ProposalBlock {
  const id = globalThis.crypto.randomUUID()
  switch (type) {
    case 'cover':
      return { id, type: 'cover', props: emptyCoverProps() }
    case 'about_2mb':
      return {
        id,
        type: 'about_2mb',
        props: {
          title: 'About',
          body: '',
          kpis: [{ label: '', value: '' }],
          fieldOrder: normalizeAboutFieldOrder(undefined),
        },
      }
    case 'why_us':
      return {
        id,
        type: 'why_us',
        props: {
          title: 'Why us',
          bullets: [''],
          fieldOrder: normalizeWhyUsFieldOrder(undefined),
        },
      }
    case 'testimonials':
      return {
        id,
        type: 'testimonials',
        props: {
          title: 'Testimonials',
          items: [{ quote: '', name: '', role: '', company: '' }],
        },
      }
    case 'comparable_cases':
      return {
        id,
        type: 'comparable_cases',
        props: {
          title: 'Cases',
          cases: [{ name: '', line: '', imageUrl: null }],
        },
      }
    case 'project_scope':
      return {
        id,
        type: 'project_scope',
        props: {
          title: 'Scope',
          bullets: [''],
          imageUrl: null,
          fieldOrder: normalizeProjectScopeFieldOrder(undefined),
          sectionSurface: 'deck',
        },
      }
    case 'pricing':
      return {
        id,
        type: 'pricing',
        props: {
          title: 'Pricing',
          rows: [{ package: '', deliverables: '', price: '' }],
          sectionSurface: 'deck',
        },
      }
    case 'timeline':
      return {
        id,
        type: 'timeline',
        props: {
          title: 'Timeline',
          milestones: [{ week: '', label: '' }],
          sectionSurface: 'deck',
        },
      }
    case 'terms':
      return { id, type: 'terms', props: { body: '', sectionSurface: 'deck' } }
    case 'visual_grid':
      return {
        id,
        type: 'visual_grid',
        props: {
          sectionTitle: '',
          rows: [
            {
              id: globalThis.crypto.randomUUID(),
              cells: [
                {
                  id: globalThis.crypto.randomUUID(),
                  kind: 'text',
                  heading: '',
                  body: '',
                },
              ],
            },
          ],
        },
      }
    case 'service_matrix': {
      const rowId = globalThis.crypto.randomUUID()
      return {
        id,
        type: 'service_matrix',
        props: {
          title: 'Services',
          columnLabels: ['S', 'M', 'L'],
          rows: [
            {
              id: rowId,
              label: '',
              included: [false, false, false],
            },
          ],
        },
      }
    }
    case 'video':
      return {
        id,
        type: 'video',
        props: {
          title: '',
          source: 'embed',
          embedUrl: '',
        },
      }
    case 'image_comparison':
      return {
        id,
        type: 'image_comparison',
        props: {
          beforeUrl: null,
          afterUrl: null,
          beforeLabel: '',
          afterLabel: '',
          initialSplitPercent: 50,
        },
      }
    case 'service_tags':
      return {
        id,
        type: 'service_tags',
        props: {
          title: 'Leistungen',
          entries: [],
        },
      }
  }
}

export function parseProposalBlocks(raw: unknown): ProposalBlock[] {
  const parsed = proposalBlocksSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(`invalid_proposal_blocks: ${parsed.error.message}`)
  }
  return parsed.data
}

/** Defaults for new blocks (DE copy — mirror in EN via proposal language switch later). */
export function emptyCoverProps(): z.infer<typeof coverProps> {
  return {
    headline: ' ',
    subtitle: ' ',
    dateLabel: '',
    clientCompany: '',
    contactName: '',
    contactRole: '',
    contactEmail: '',
    documentKindLine: '',
    issuedLine: '',
    validLine: '',
    senderBlock: '',
    recipientBlock: '',
    letterheadSurface: 'dark',
    heroImageUrl: null,
    clientLogoUrl: null,
    studioLogoUrl: null,
    deckTheme: undefined,
    fieldOrder: normalizeCoverFieldOrder(undefined),
  }
}
