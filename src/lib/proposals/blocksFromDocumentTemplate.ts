import type { ProposalBlock } from '@/lib/proposals/blockSchema'
import { emptyCoverProps, normalizeProjectScopeFieldOrder } from '@/lib/proposals/blockSchema'
import type { DocumentKind } from '@/lib/proposals/documentKind'
import { blocksForPreset, type ProposalPresetId } from '@/lib/proposals/presets'
import { buildPricingRowsFromCatalog } from '@/lib/proposals/buildPricingRowsFromCatalog'
import {
  buildSectionPlaceholderContext,
  substituteSectionPlaceholders,
  type SectionPlaceholderContext,
} from '@/lib/proposals/sectionPlaceholders'
import { STUDIO_DEFAULT_TEMPLATE_IDS } from '@/lib/studio/defaultDocumentTemplates'
import type {
  StudioDocumentSection,
  StudioDocumentSectionKind,
  StudioDocumentTemplate,
  StudioDocumentTemplateKind,
} from '@/stores/studioProfileTypes'

function nid(): string {
  return globalThis.crypto.randomUUID()
}

const PROPOSAL_TEMPLATE_PRESET: Partial<Record<string, ProposalPresetId>> = {
  [STUDIO_DEFAULT_TEMPLATE_IDS.proposalDeveloperDe]: 'developer',
  [STUDIO_DEFAULT_TEMPLATE_IDS.proposalArchitectEn]: 'architect',
  [STUDIO_DEFAULT_TEMPLATE_IDS.proposalCustomMinimal]: 'custom',
}

function parseStudioTemplates(raw: unknown): StudioDocumentTemplate[] {
  if (!raw || typeof raw !== 'object') return []
  const templates = (raw as { documentTemplates?: unknown }).documentTemplates
  return Array.isArray(templates) ? (templates as StudioDocumentTemplate[]) : []
}

function parseStudioSections(raw: unknown): StudioDocumentSection[] {
  if (!raw || typeof raw !== 'object') return []
  const sections = (raw as { documentSections?: unknown }).documentSections
  return Array.isArray(sections) ? (sections as StudioDocumentSection[]) : []
}

export function pickDocumentTemplate(
  templates: StudioDocumentTemplate[],
  kind: StudioDocumentTemplateKind,
  templateId?: string | null,
): StudioDocumentTemplate | null {
  if (templateId) {
    return templates.find((tpl) => tpl.id === templateId && tpl.kind === kind) ?? null
  }
  return (
    templates.find((tpl) => tpl.kind === kind && tpl.isDefault) ??
    templates.find((tpl) => tpl.kind === kind) ??
    null
  )
}

/** @deprecated Use pickDocumentTemplate */
export function pickDefaultOfferTemplate(
  templates: StudioDocumentTemplate[],
): StudioDocumentTemplate | null {
  return pickDocumentTemplate(templates, 'offer')
}

export function resolveDocumentTemplateFromStudio(
  studioGeneral: unknown,
  documentKind: DocumentKind,
  templateId?: string | null,
): {
  template: StudioDocumentTemplate | null
  sections: StudioDocumentSection[]
} {
  const kind: StudioDocumentTemplateKind = documentKind === 'offer' ? 'offer' : 'proposal'
  if (!studioGeneral || typeof studioGeneral !== 'object') {
    return { template: null, sections: [] }
  }
  const g = studioGeneral as Record<string, unknown>
  const templates = parseStudioTemplates(g)
  const sections = parseStudioSections(g)
  return {
    template: pickDocumentTemplate(templates, kind, templateId),
    sections,
  }
}

/** @deprecated Use resolveDocumentTemplateFromStudio */
export function resolveOfferTemplateFromStudioGeneral(studioGeneral: unknown): {
  template: StudioDocumentTemplate | null
  sections: StudioDocumentSection[]
} {
  return resolveDocumentTemplateFromStudio(studioGeneral, 'offer')
}

function sectionMatchesLocale(section: StudioDocumentSection, language: 'de' | 'en'): boolean {
  if (section.locale === 'any') return true
  return section.locale === language
}

function sectionSurfaceForKind(kind: StudioDocumentSectionKind): 'deck' | 'letterhead' {
  if (kind === 'terms' || kind === 'scope') return 'deck'
  return 'letterhead'
}

function mapSectionToBlock(
  section: StudioDocumentSection,
  ctx: SectionPlaceholderContext,
): ProposalBlock | null {
  const body = substituteSectionPlaceholders(section.body, ctx).trim()
  if (!body) return null

  if (section.kind === 'scope') {
    return {
      id: nid(),
      type: 'project_scope',
      props: {
        title: section.name,
        bullets: body.split('\n').map((line) => line.trim()).filter(Boolean),
        imageUrl: null,
        fieldOrder: normalizeProjectScopeFieldOrder(undefined),
        sectionSurface: 'deck',
      },
    }
  }

  return {
    id: nid(),
    type: 'terms',
    props: {
      body,
      sectionSurface: sectionSurfaceForKind(section.kind),
    },
  }
}

function injectPricingRows(blocks: ProposalBlock[], rows: { package: string; deliverables: string; price: string }[]): void {
  if (rows.length === 0) return
  const idx = blocks.findIndex((b) => b.type === 'pricing')
  if (idx >= 0) {
    const block = blocks[idx]
    if (block.type === 'pricing') {
      blocks[idx] = {
        ...block,
        props: { ...block.props, rows },
      }
    }
    return
  }
  blocks.push({
    id: nid(),
    type: 'pricing',
    props: {
      title: 'Pricing',
      rows,
      sectionSurface: 'deck',
    },
  })
}

function applyCoverIntro(blocks: ProposalBlock[], body: string): void {
  const cover = blocks.find((b) => b.type === 'cover')
  if (!cover || cover.type !== 'cover') return
  const prev = cover.props.subtitle.trim()
  cover.props.subtitle = prev ? `${body}\n\n${prev}` : body
}

function appendTemplateSections(
  blocks: ProposalBlock[],
  template: StudioDocumentTemplate | null,
  sections: StudioDocumentSection[],
  ctx: SectionPlaceholderContext,
  language: 'de' | 'en',
): void {
  for (const sectionId of template?.sectionIds ?? []) {
    const section = sections.find((s) => s.id === sectionId)
    if (!section || !sectionMatchesLocale(section, language)) continue

    if (section.kind === 'cover_intro') {
      const body = substituteSectionPlaceholders(section.body, ctx).trim()
      if (body) applyCoverIntro(blocks, body)
      continue
    }

    const block = mapSectionToBlock(section, ctx)
    if (block) blocks.push(block)
  }
}

export type BuildDocumentBlocksInput = {
  template: StudioDocumentTemplate | null
  sections: StudioDocumentSection[]
  documentKind: DocumentKind
  language: 'de' | 'en'
  studioGeneral: unknown
  studioSales?: unknown
}

export function blocksFromDocumentTemplate(input: BuildDocumentBlocksInput): ProposalBlock[] {
  const { template, sections, documentKind, language, studioGeneral, studioSales } = input
  const ctx = buildSectionPlaceholderContext(studioGeneral, template?.defaults.bankAccountId)
  const pricingRows = buildPricingRowsFromCatalog(studioSales, template?.defaults.pricingPresetId)

  if (documentKind === 'proposal') {
    const presetId =
      (template?.id ? PROPOSAL_TEMPLATE_PRESET[template.id] : undefined) ?? 'developer'
    const blocks = blocksForPreset(presetId)
    injectPricingRows(blocks, pricingRows)
    appendTemplateSections(blocks, template, sections, ctx, language)
    return blocks
  }

  const cover = emptyCoverProps()
  cover.letterheadSurface = 'light'
  cover.documentKindLine = 'Offer'

  const blocks: ProposalBlock[] = [{ id: nid(), type: 'cover', props: cover }]
  appendTemplateSections(blocks, template, sections, ctx, language)
  injectPricingRows(blocks, pricingRows)

  if (blocks.length === 1) {
    blocks.push({
      id: nid(),
      type: 'terms',
      props: { body: '', sectionSurface: 'deck' },
    })
  }

  return blocks
}

/** @deprecated Use blocksFromDocumentTemplate */
export function blocksFromOfferTemplate(
  template: StudioDocumentTemplate | null,
  sections: StudioDocumentSection[],
): ProposalBlock[] {
  return blocksFromDocumentTemplate({
    template,
    sections,
    documentKind: 'offer',
    language: 'en',
    studioGeneral: null,
  })
}

export function validityDaysFromDocumentTemplate(template: StudioDocumentTemplate | null): number | null {
  const raw = template?.defaults.validityDays
  if (raw === null || raw === undefined || raw === '') return null
  const n = Number.parseInt(String(raw), 10)
  if (!Number.isFinite(n) || n < 1 || n > 365) return null
  return n
}

/** @deprecated Use validityDaysFromDocumentTemplate */
export function validityDaysFromOfferTemplate(template: StudioDocumentTemplate | null): number | null {
  return validityDaysFromDocumentTemplate(template)
}
