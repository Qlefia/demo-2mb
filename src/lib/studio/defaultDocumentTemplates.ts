import { STUDIO_DEFAULT_SECTION_IDS } from '@/lib/studio/defaultDocumentSections'
import type { StudioDocumentTemplate, StudioDocumentTemplateDefaults } from '@/stores/studioProfileTypes'

function emptyTemplateDefaults(): StudioDocumentTemplateDefaults {
  return {
    bankAccountId: null,
    taxModeOverride: null,
    validityDays: '',
    pricingPresetId: null,
  }
}

/** Stable ids so seeds and tests can reference the canonical templates. */
export const STUDIO_DEFAULT_TEMPLATE_IDS = {
  villaOfferDe: 'tpl-offer-villa-de',
  architectsOfferEn: 'tpl-offer-architects-en',
  quickEstimateEn: 'tpl-offer-quick-en',
  proposalDeveloperDe: 'tpl-proposal-developer-de',
  proposalArchitectEn: 'tpl-proposal-architect-en',
  proposalCustomMinimal: 'tpl-proposal-custom-minimal',
} as const

/** Seed offer templates that compose the default section library; first one is workspace default. */
export function defaultStudioDocumentTemplates(): StudioDocumentTemplate[] {
  return [
    {
      id: STUDIO_DEFAULT_TEMPLATE_IDS.villaOfferDe,
      kind: 'offer',
      name: 'Villa visualization offer (DE)',
      description: 'Interior + exterior render package, German B2B copy, bank block on cover.',
      isDefault: true,
      sectionIds: [
        STUDIO_DEFAULT_SECTION_IDS.termsDeB2B,
        STUDIO_DEFAULT_SECTION_IDS.bankBlock,
        STUDIO_DEFAULT_SECTION_IDS.signatoryBlock,
        STUDIO_DEFAULT_SECTION_IDS.footerNote,
      ],
      defaults: { ...emptyTemplateDefaults(), validityDays: '30' },
    },
    {
      id: STUDIO_DEFAULT_TEMPLATE_IDS.architectsOfferEn,
      kind: 'offer',
      name: 'Architects firm offer (EN)',
      description: 'Pitch for architecture studios in DACH / UK with English terms.',
      isDefault: false,
      sectionIds: [
        STUDIO_DEFAULT_SECTION_IDS.termsEnB2B,
        STUDIO_DEFAULT_SECTION_IDS.bankBlock,
        STUDIO_DEFAULT_SECTION_IDS.signatoryBlock,
      ],
      defaults: { ...emptyTemplateDefaults(), validityDays: '21' },
    },
    {
      id: STUDIO_DEFAULT_TEMPLATE_IDS.quickEstimateEn,
      kind: 'offer',
      name: 'Quick estimate (EN)',
      description: 'Short ballpark estimate with minimal terms — for early conversations.',
      isDefault: false,
      sectionIds: [STUDIO_DEFAULT_SECTION_IDS.termsEnB2B, STUDIO_DEFAULT_SECTION_IDS.signatoryBlock],
      defaults: { ...emptyTemplateDefaults(), validityDays: '7' },
    },
    {
      id: STUDIO_DEFAULT_TEMPLATE_IDS.proposalDeveloperDe,
      kind: 'proposal',
      name: 'Villa visualization deck (DE)',
      description: 'Full developer deck — service tags, gallery, pricing, timeline; DE terms from Studio library.',
      isDefault: true,
      sectionIds: [
        STUDIO_DEFAULT_SECTION_IDS.termsDeB2B,
        STUDIO_DEFAULT_SECTION_IDS.bankBlock,
        STUDIO_DEFAULT_SECTION_IDS.signatoryBlock,
      ],
      defaults: { ...emptyTemplateDefaults(), validityDays: '30' },
    },
    {
      id: STUDIO_DEFAULT_TEMPLATE_IDS.proposalArchitectEn,
      kind: 'proposal',
      name: 'Architects firm deck (EN)',
      description: 'Architecture-studio pitch deck with EN terms and signatory block.',
      isDefault: false,
      sectionIds: [
        STUDIO_DEFAULT_SECTION_IDS.termsEnB2B,
        STUDIO_DEFAULT_SECTION_IDS.signatoryBlock,
      ],
      defaults: { ...emptyTemplateDefaults(), validityDays: '21' },
    },
    {
      id: STUDIO_DEFAULT_TEMPLATE_IDS.proposalCustomMinimal,
      kind: 'proposal',
      name: 'Minimal custom deck',
      description: 'Empty custom skeleton — add blocks manually after create.',
      isDefault: false,
      sectionIds: [],
      defaults: { ...emptyTemplateDefaults(), validityDays: '14' },
    },
  ]
}
