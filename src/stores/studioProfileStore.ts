'use client'

import { create } from 'zustand'
import { createEmptyBlock, visualGridProps } from '@/lib/proposals/blockSchema'
import type { VisualGridProps } from '@/lib/proposals/blockSchema'
import {
  STUDIO_BRAND_KIT_MAX_FONTS,
  STUDIO_PROFILE_VIDEO_URL_MAX_CHARS,
  STUDIO_WORK_TEXT_LIMITS,
} from '@/features/studio-settings/constants'
import { createEmptyPriceTier, normalizeCommercialPriceTiers } from '@/features/studio-settings/lib/studioPriceTiers'
import { createEmptyStudioBankAccount } from '@/lib/studio/defaultBankAccounts'
import { coerceStudioWorkPublicationStatus } from '@/features/studio-settings/lib/studioWorkPublicationStatus'
import { STUDIO_BRAND_PROFILE_MAX } from '@/features/studio-settings/lib/pickSingleStudioBrand'
import type {
  StudioBankAccount,
  StudioBrandColor,
  StudioBrandFont,
  StudioBrandFontSource,
  StudioBrandLogo,
  StudioBrandLogoRole,
  StudioBrandProfile,
  StudioBrandSocialLink,
  StudioDocumentTemplate,
  StudioDocumentTemplateKind,
  StudioGeneral,
  StudioOffice,
  StudioOfficeKind,
  StudioProduct,
  StudioProductBillingKind,
  StudioReview,
  StudioSegment,
  StudioServiceCatalogItem,
  StudioServiceGroup,
  StudioTool,
  StudioToolCategory,
  StudioWork,
} from '@/stores/studioProfileTypes'
import {
  STUDIO_BRAND_FONT_SOURCES,
  STUDIO_BRAND_LOGO_ROLES,
  STUDIO_PRODUCT_BILLING_KINDS,
  STUDIO_TOOL_CATEGORIES,
} from '@/stores/studioProfileTypes'
import {
  STUDIO_DEFAULT_PAYMENT_TERMS,
  STUDIO_DEFAULT_REVISIONS_NOTE,
  STUDIO_DEFAULT_VAT_NOTE,
} from '@/lib/studio/defaultProposalBoilerplate'
import { defaultStudioBankAccounts } from '@/lib/studio/defaultBankAccounts'
import { defaultStudioDocumentSections } from '@/lib/studio/defaultDocumentSections'
import { defaultStudioDocumentTemplates } from '@/lib/studio/defaultDocumentTemplates'
import { defaultInvoiceNumbering, defaultOfferNumbering } from '@/lib/studio/defaultNumbering'
import { defaultStudioPaymentDefaults } from '@/lib/studio/defaultPaymentDefaults'
import { defaultStudioTaxProfile } from '@/lib/studio/defaultTaxProfile'
import {
  normalizeBankAccounts,
  normalizeDocumentSections,
  normalizeDocumentTemplates,
  normalizeInvoiceNumbering,
  normalizeOfferNumbering,
  normalizePaymentDefaults,
  normalizeTaxProfile,
} from '@/lib/studio/normalizeBillingGeneral'
import {
  STUDIO_DISPLAY_CURRENCIES,
  STUDIO_PROPOSAL_DEFAULT_LOCALES,
  STUDIO_TIMEZONES,
} from '@/features/studio-settings/lib/studioGlobalDefaultsOptions'

function newId(): string {
  return crypto.randomUUID()
}

function createEmptyBrandProfile(isPrimary: boolean): StudioBrandProfile {
  return {
    id: newId(),
    isPrimary,
    name: '',
    slogan: '',
    description: '',
    strengthPositioning: '',
    studioPrinciples: '',
    logos: [],
    fonts: [],
    accentFontId: null,
    bodyFontId: null,
    colors: [],
    socialNetworks: [],
    voiceGuidelines: '',
    strategyNotes: '',
    businessProfile: '',
  }
}

function normalizeBrandLogo(raw: unknown): StudioBrandLogo | null {
  if (!raw || typeof raw !== 'object') return null
  const x = raw as Partial<StudioBrandLogo>
  if (typeof x.id !== 'string') return null
  const role: StudioBrandLogoRole =
    typeof x.role === 'string' && (STUDIO_BRAND_LOGO_ROLES as readonly string[]).includes(x.role)
      ? (x.role as StudioBrandLogoRole)
      : 'other'
  return {
    id: x.id,
    label: typeof x.label === 'string' ? x.label : '',
    role,
    imageDataUrl: typeof x.imageDataUrl === 'string' ? x.imageDataUrl : null,
  }
}

function normalizeHexColor(v: unknown): string {
  if (typeof v !== 'string') return '#000000'
  const t = v.trim()
  if (/^#[0-9A-Fa-f]{6}$/.test(t)) return t.toUpperCase()
  if (/^[0-9A-Fa-f]{6}$/.test(t)) return `#${t.toUpperCase()}`
  return '#000000'
}

function normalizeBrandColor(raw: unknown): StudioBrandColor | null {
  if (!raw || typeof raw !== 'object') return null
  const x = raw as Partial<StudioBrandColor>
  if (typeof x.id !== 'string') return null
  return {
    id: x.id,
    hex: normalizeHexColor(x.hex),
    name: typeof x.name === 'string' ? x.name.slice(0, 120) : '',
  }
}

function normalizeBrandFont(raw: unknown): StudioBrandFont | null {
  if (!raw || typeof raw !== 'object') return null
  const x = raw as Partial<StudioBrandFont>
  if (typeof x.id !== 'string') return null
  const source: StudioBrandFontSource =
    typeof x.source === 'string' && (STUDIO_BRAND_FONT_SOURCES as readonly string[]).includes(x.source)
      ? (x.source as StudioBrandFontSource)
      : 'google'
  return {
    id: x.id,
    family: typeof x.family === 'string' ? x.family.slice(0, 120) : '',
    source,
    fontDataUrl: typeof x.fontDataUrl === 'string' ? x.fontDataUrl.slice(0, 2_800_000) : null,
  }
}

function normalizeBrandSocialLink(raw: unknown): StudioBrandSocialLink | null {
  if (!raw || typeof raw !== 'object') return null
  const x = raw as Partial<StudioBrandSocialLink>
  if (typeof x.id !== 'string') return null
  return {
    id: x.id,
    label: typeof x.label === 'string' ? x.label.slice(0, 80) : '',
    url: typeof x.url === 'string' ? x.url.slice(0, 500) : '',
  }
}

function normalizeStudioBrandProfile(raw: unknown): StudioBrandProfile | null {
  if (!raw || typeof raw !== 'object') return null
  const x = raw as Partial<StudioBrandProfile>
  if (typeof x.id !== 'string') return null
  const logos = Array.isArray(x.logos)
    ? x.logos.map(normalizeBrandLogo).filter((l): l is StudioBrandLogo => l !== null)
    : []
  const fonts = Array.isArray(x.fonts)
    ? x.fonts
        .map(normalizeBrandFont)
        .filter((f): f is StudioBrandFont => f !== null)
        .slice(0, STUDIO_BRAND_KIT_MAX_FONTS)
    : []
  const colors = Array.isArray(x.colors)
    ? x.colors.map(normalizeBrandColor).filter((c): c is StudioBrandColor => c !== null)
    : []
  const socialNetworks = Array.isArray(x.socialNetworks)
    ? x.socialNetworks.map(normalizeBrandSocialLink).filter((n): n is StudioBrandSocialLink => n !== null)
    : []
  const accentFontId = typeof x.accentFontId === 'string' ? x.accentFontId : null
  const bodyFontId = typeof x.bodyFontId === 'string' ? x.bodyFontId : null
  const validFontIds = new Set(fonts.map((f) => f.id))
  return {
    id: x.id,
    isPrimary: x.isPrimary === true,
    name: typeof x.name === 'string' ? x.name : '',
    slogan: typeof x.slogan === 'string' ? x.slogan : '',
    description: typeof x.description === 'string' ? x.description : '',
    strengthPositioning: typeof x.strengthPositioning === 'string' ? x.strengthPositioning : '',
    studioPrinciples: typeof x.studioPrinciples === 'string' ? x.studioPrinciples : '',
    logos,
    fonts,
    accentFontId: accentFontId && validFontIds.has(accentFontId) ? accentFontId : null,
    bodyFontId: bodyFontId && validFontIds.has(bodyFontId) ? bodyFontId : null,
    colors,
    socialNetworks,
    voiceGuidelines: typeof x.voiceGuidelines === 'string' ? x.voiceGuidelines : '',
    strategyNotes: typeof x.strategyNotes === 'string' ? x.strategyNotes : '',
    businessProfile: typeof x.businessProfile === 'string' ? x.businessProfile : '',
  }
}

function ensureSinglePrimaryBrand(brands: StudioBrandProfile[]): StudioBrandProfile[] {
  if (brands.length === 0) return [createEmptyBrandProfile(true)]
  const primaryIdx = brands.findIndex((b) => b.isPrimary)
  if (primaryIdx < 0) {
    return brands.map((b, i) => (i === 0 ? { ...b, isPrimary: true } : { ...b, isPrimary: false }))
  }
  return brands.map((b, i) => (i === primaryIdx ? { ...b, isPrimary: true } : { ...b, isPrimary: false }))
}

function ensureSinglePrimaryLogoPerBrand(brand: StudioBrandProfile): StudioBrandProfile {
  const primaryIndices = brand.logos.map((l, i) => (l.role === 'primary' ? i : -1)).filter((i) => i >= 0)
  if (primaryIndices.length <= 1) return brand
  const [, ...duplicatePrimaryIndices] = primaryIndices
  return {
    ...brand,
    logos: brand.logos.map((l, i) =>
      duplicatePrimaryIndices.includes(i)
        ? { ...l, role: l.role === 'primary' ? 'wordmark' : l.role }
        : l,
    ),
  }
}

function normalizeStudioBrandsFromPersisted(
  raw: unknown,
  legacyLogoDataUrl: string | null | undefined,
): StudioBrandProfile[] {
  const brands = Array.isArray(raw)
    ? raw.map(normalizeStudioBrandProfile).filter((b): b is StudioBrandProfile => b !== null)
    : []
  if (brands.length > 0) {
    return ensureSinglePrimaryBrand(brands)
      .slice(0, STUDIO_BRAND_PROFILE_MAX)
      .map(ensureSinglePrimaryLogoPerBrand)
  }
  const first = createEmptyBrandProfile(true)
  if (typeof legacyLogoDataUrl === 'string' && legacyLogoDataUrl.length > 0) {
    first.logos = [{ id: newId(), label: '', role: 'primary', imageDataUrl: legacyLogoDataUrl }]
  }
  return [first]
}

function coerceProposalLocale(v: unknown): (typeof STUDIO_PROPOSAL_DEFAULT_LOCALES)[number] {
  if (typeof v === 'string' && (STUDIO_PROPOSAL_DEFAULT_LOCALES as readonly string[]).includes(v)) {
    return v as (typeof STUDIO_PROPOSAL_DEFAULT_LOCALES)[number]
  }
  return 'de'
}

function coerceDisplayCurrency(v: unknown): (typeof STUDIO_DISPLAY_CURRENCIES)[number] {
  if (typeof v === 'string' && (STUDIO_DISPLAY_CURRENCIES as readonly string[]).includes(v)) {
    return v as (typeof STUDIO_DISPLAY_CURRENCIES)[number]
  }
  return 'EUR'
}

function coerceStudioTimezone(v: unknown): (typeof STUDIO_TIMEZONES)[number] {
  if (typeof v === 'string' && (STUDIO_TIMEZONES as readonly string[]).includes(v)) {
    return v as (typeof STUDIO_TIMEZONES)[number]
  }
  return 'Europe/Berlin'
}

function mergePersistedGeneral(partial: Partial<StudioGeneral> | undefined): StudioGeneral {
  const base = initialGeneral()
  const raw = { ...base, ...(partial ?? {}) } as Partial<StudioGeneral> & {
    logoDataUrl?: string | null
    heroBannerMode?: unknown
    heroBannerImageDataUrl?: unknown
    heroBannerVideoUrl?: unknown
  }
  const legacyLogo = raw.logoDataUrl
  const studioBrands = normalizeStudioBrandsFromPersisted(raw.studioBrands, legacyLogo)
  const general: StudioGeneral = {
    ...base,
    website: typeof raw.website === 'string' ? raw.website : base.website,
    subheader: typeof raw.subheader === 'string' ? raw.subheader : base.subheader,
    headline: typeof raw.headline === 'string' ? raw.headline : base.headline,
    subtitle: typeof raw.subtitle === 'string' ? raw.subtitle : base.subtitle,
    about: typeof raw.about === 'string' ? raw.about : base.about,
    advantages: typeof raw.advantages === 'string' ? raw.advantages : base.advantages,
    defaultProposalLocale: coerceProposalLocale(raw.defaultProposalLocale),
    displayCurrency: coerceDisplayCurrency(raw.displayCurrency),
    studioTimezone: coerceStudioTimezone(raw.studioTimezone),
    defaultEmailSignOff:
      typeof raw.defaultEmailSignOff === 'string'
        ? raw.defaultEmailSignOff.slice(0, 500)
        : base.defaultEmailSignOff,
    legalEntityName: typeof raw.legalEntityName === 'string' ? raw.legalEntityName : base.legalEntityName,
    tradingName: typeof raw.tradingName === 'string' ? raw.tradingName : base.tradingName,
    registrationDetails:
      typeof raw.registrationDetails === 'string' ? raw.registrationDetails : base.registrationDetails,
    vatId: typeof raw.vatId === 'string' ? raw.vatId : base.vatId,
    addressStreet: typeof raw.addressStreet === 'string' ? raw.addressStreet : base.addressStreet,
    addressLine2: typeof raw.addressLine2 === 'string' ? raw.addressLine2 : base.addressLine2,
    addressPostalCode: typeof raw.addressPostalCode === 'string' ? raw.addressPostalCode : base.addressPostalCode,
    addressLocality: typeof raw.addressLocality === 'string' ? raw.addressLocality : base.addressLocality,
    addressCountry: typeof raw.addressCountry === 'string' ? raw.addressCountry : base.addressCountry,
    officePhone: typeof raw.officePhone === 'string' ? raw.officePhone : base.officePhone,
    officeEmail: typeof raw.officeEmail === 'string' ? raw.officeEmail : base.officeEmail,
    supervisoryAuthority:
      typeof raw.supervisoryAuthority === 'string' ? raw.supervisoryAuthority : base.supervisoryAuthority,
    professionalLiabilityInsurance:
      typeof raw.professionalLiabilityInsurance === 'string'
        ? raw.professionalLiabilityInsurance
        : base.professionalLiabilityInsurance,
    insuranceCoverageScope:
      typeof raw.insuranceCoverageScope === 'string'
        ? raw.insuranceCoverageScope
        : base.insuranceCoverageScope,
    visualizationCredits:
      typeof raw.visualizationCredits === 'string' ? raw.visualizationCredits : base.visualizationCredits,
    signingName: typeof raw.signingName === 'string' ? raw.signingName : base.signingName,
    signingRole: typeof raw.signingRole === 'string' ? raw.signingRole : base.signingRole,
    signingEmail: typeof raw.signingEmail === 'string' ? raw.signingEmail : base.signingEmail,
    signingPhone: typeof raw.signingPhone === 'string' ? raw.signingPhone : base.signingPhone,
    signing2Name: typeof raw.signing2Name === 'string' ? raw.signing2Name : base.signing2Name,
    signing2Role: typeof raw.signing2Role === 'string' ? raw.signing2Role : base.signing2Role,
    signing2Email: typeof raw.signing2Email === 'string' ? raw.signing2Email : base.signing2Email,
    offerValidityDays: typeof raw.offerValidityDays === 'string' ? raw.offerValidityDays : base.offerValidityDays,
    shareLinkValidityDays:
      typeof raw.shareLinkValidityDays === 'string' ? raw.shareLinkValidityDays : base.shareLinkValidityDays,
    defaultPaymentTerms:
      typeof raw.defaultPaymentTerms === 'string' ? raw.defaultPaymentTerms : base.defaultPaymentTerms,
    defaultVatNote: typeof raw.defaultVatNote === 'string' ? raw.defaultVatNote : base.defaultVatNote,
    defaultRevisionsNote:
      typeof raw.defaultRevisionsNote === 'string' ? raw.defaultRevisionsNote : base.defaultRevisionsNote,
    studioBrands,
    studioOffices: normalizeStudioOffices(raw.studioOffices ?? base.studioOffices),
    bankAccounts: normalizeBankAccounts(raw.bankAccounts, base.displayCurrency),
    taxProfile: hydrateTaxProfileFromLegacy(normalizeTaxProfile(raw.taxProfile), raw.vatId),
    offerNumbering: normalizeOfferNumbering(raw.offerNumbering),
    invoiceNumbering: normalizeInvoiceNumbering(raw.invoiceNumbering),
    paymentDefaults: normalizePaymentDefaults(raw.paymentDefaults),
    documentSections: hydrateDocumentSectionsWithDefaults(raw.documentSections),
    documentTemplates: hydrateDocumentTemplatesWithDefaults(raw.documentSections, raw.documentTemplates),
  }
  return general
}

/** Preserve legacy `vatId` text inside the new `taxProfile.ustIdNr` slot on first migration. */
function hydrateTaxProfileFromLegacy(
  profile: ReturnType<typeof normalizeTaxProfile>,
  legacyVatId: unknown,
): ReturnType<typeof normalizeTaxProfile> {
  if (profile.ustIdNr.length > 0) return profile
  if (typeof legacyVatId !== 'string' || legacyVatId.trim().length === 0) return profile
  return { ...profile, ustIdNr: legacyVatId.trim().toUpperCase() }
}

function hydrateDocumentSectionsWithDefaults(raw: unknown): ReturnType<typeof normalizeDocumentSections> {
  const normalized = normalizeDocumentSections(raw)
  if (normalized.length > 0) return normalized
  return defaultStudioDocumentSections()
}

function hydrateDocumentTemplatesWithDefaults(
  sectionsRaw: unknown,
  templatesRaw: unknown,
): ReturnType<typeof normalizeDocumentTemplates> {
  const sections = hydrateDocumentSectionsWithDefaults(sectionsRaw)
  const knownIds = new Set(sections.map((s) => s.id))
  const normalized = normalizeDocumentTemplates(templatesRaw, knownIds)
  if (normalized.length > 0) return normalized
  const seeds = defaultStudioDocumentTemplates()
  return normalizeDocumentTemplates(seeds, knownIds)
}

function initialGeneral(): StudioGeneral {
  return {
    website: '',
    subheader: '',
    headline: '',
    subtitle: '',
    studioBrands: [createEmptyBrandProfile(true)],
    about: '',
    advantages: '',
    defaultProposalLocale: 'de',
    displayCurrency: 'EUR',
    studioTimezone: 'Europe/Berlin',
    defaultEmailSignOff: '',
    legalEntityName: '',
    tradingName: '',
    registrationDetails: '',
    vatId: '',
    addressStreet: '',
    addressLine2: '',
    addressPostalCode: '',
    addressLocality: '',
    addressCountry: '',
    officePhone: '',
    officeEmail: '',
    supervisoryAuthority: '',
    professionalLiabilityInsurance: '',
    insuranceCoverageScope: '',
    visualizationCredits: '',
    signingName: '',
    signingRole: '',
    signingEmail: '',
    signingPhone: '',
    signing2Name: '',
    signing2Role: '',
    signing2Email: '',
    offerValidityDays: '',
    shareLinkValidityDays: '',
    defaultPaymentTerms: STUDIO_DEFAULT_PAYMENT_TERMS,
    defaultVatNote: STUDIO_DEFAULT_VAT_NOTE,
    defaultRevisionsNote: STUDIO_DEFAULT_REVISIONS_NOTE,
    studioOffices: [],
    bankAccounts: defaultStudioBankAccounts(),
    taxProfile: defaultStudioTaxProfile(),
    offerNumbering: defaultOfferNumbering(),
    invoiceNumbering: defaultInvoiceNumbering(),
    paymentDefaults: defaultStudioPaymentDefaults(),
    documentSections: defaultStudioDocumentSections(),
    documentTemplates: defaultStudioDocumentTemplates(),
  }
}

export type StudioProfileState = {
  general: StudioGeneral
  serviceCatalog: StudioServiceCatalogItem[]
  serviceGroups: StudioServiceGroup[]
  segments: StudioSegment[]
  works: StudioWork[]
  reviews: StudioReview[]
  tools: StudioTool[]
  products: StudioProduct[]

  setGeneral: (patch: Partial<StudioGeneral>) => void

  addOffice: () => string
  updateOffice: (id: string, patch: Partial<StudioOffice>) => void
  removeOffice: (id: string) => void
  reorderOffices: (ids: string[]) => void

  /** Workspace-wide bank-account library. One default per workspace (auto-promoted on delete). */
  addBankAccount: () => string
  updateBankAccount: (id: string, patch: Partial<StudioBankAccount>) => void
  removeBankAccount: (id: string) => void
  setDefaultBankAccount: (id: string) => void
  reorderBankAccounts: (ids: string[]) => void

  /** Workspace document templates (offer / proposal / invoice). One default per `kind`. */
  addDocumentTemplate: (kind: StudioDocumentTemplateKind) => string
  updateDocumentTemplate: (id: string, patch: Partial<StudioDocumentTemplate>) => void
  removeDocumentTemplate: (id: string) => void
  setDefaultDocumentTemplate: (id: string) => void
  reorderDocumentTemplates: (ids: string[]) => void

  addCatalogItem: () => string
  updateCatalogItem: (id: string, patch: Partial<StudioServiceCatalogItem>) => void
  removeCatalogItem: (id: string) => void
  reorderCatalog: (ids: string[]) => void

  addServiceGroup: () => string
  updateServiceGroup: (id: string, patch: Partial<StudioServiceGroup>) => void
  /** Add a catalogue line id to a group using latest store state (avoids stale memberIds overwrites). */
  appendServiceGroupMember: (groupId: string, catalogLineId: string) => void
  /** Toggle catalogue line membership using latest store state. */
  toggleServiceGroupMember: (groupId: string, catalogLineId: string) => void
  removeServiceGroup: (id: string) => void
  reorderServiceGroups: (ids: string[]) => void

  addSegment: () => string
  updateSegment: (id: string, patch: Partial<StudioSegment>) => void
  removeSegment: (id: string) => void
  reorderSegments: (ids: string[]) => void

  addWork: () => string
  updateWork: (id: string, patch: Partial<StudioWork>) => void
  removeWork: (id: string) => void
  reorderWorks: (ids: string[]) => void

  addReview: () => string
  updateReview: (id: string, patch: Partial<StudioReview>) => void
  removeReview: (id: string) => void
  reorderReviews: (ids: string[]) => void

  addTool: () => string
  updateTool: (id: string, patch: Partial<StudioTool>) => void
  removeTool: (id: string) => void
  reorderTools: (ids: string[]) => void

  addProduct: () => string
  updateProduct: (id: string, patch: Partial<StudioProduct>) => void
  removeProduct: (id: string) => void
  reorderProducts: (ids: string[]) => void

  /** Replace state from Supabase (normalized); used by Realtime + initial load. */
  hydrateFromServer: (payload: {
    general?: unknown
    serviceCatalog?: unknown[]
    serviceGroups?: unknown[]
    segments?: unknown[]
    works?: unknown[]
    reviews?: unknown[]
    tools?: unknown[]
    products?: unknown[]
  }) => void
}

function normalizeCatalogItem(raw: unknown): StudioServiceCatalogItem | null {
  if (!raw || typeof raw !== 'object') return null
  const x = raw as Partial<StudioServiceCatalogItem>
  if (typeof x.id !== 'string') return null
  const legacy = x as Partial<StudioServiceCatalogItem> & {
    priceFrom?: string
    priceTo?: string
    currency?: string
    priceUnit?: string
    durationNote?: string
  }
  const pricing = normalizeCommercialPriceTiers(x, legacy, '')
  return {
    id: x.id,
    title: x.title ?? '',
    description: x.description ?? '',
    summary: x.summary ?? '',
    code: x.code ?? '',
    priceTiers: pricing.priceTiers,
    activePriceTierId: pricing.activePriceTierId,
    externalUrl: x.externalUrl ?? '',
    mediaMode: x.mediaMode === 'video' ? 'video' : 'image',
    mediaDataUrl:
      x.mediaDataUrl === null || typeof x.mediaDataUrl === 'string' ? x.mediaDataUrl : null,
    mediaPortraitDataUrl:
      x.mediaPortraitDataUrl === null || typeof x.mediaPortraitDataUrl === 'string'
        ? x.mediaPortraitDataUrl
        : null,
    mediaVideoUrl:
      typeof x.mediaVideoUrl === 'string'
        ? x.mediaVideoUrl.slice(0, STUDIO_PROFILE_VIDEO_URL_MAX_CHARS)
        : '',
    linkedWorkId: typeof x.linkedWorkId === 'string' && x.linkedWorkId.length > 0 ? x.linkedWorkId : null,
    linkedToolIds: Array.isArray(x.linkedToolIds)
      ? x.linkedToolIds.filter((tid): tid is string => typeof tid === 'string')
      : [],
  }
}

function normalizeServiceGroup(raw: unknown): StudioServiceGroup | null {
  if (!raw || typeof raw !== 'object') return null
  const x = raw as Partial<StudioServiceGroup> & { members?: unknown }
  if (typeof x.id !== 'string') return null
  const fromMemberIds = Array.isArray(x.memberIds) ? x.memberIds : null
  const fromLegacyMembers = Array.isArray(x.members) ? x.members : null
  const rawList = fromMemberIds ?? fromLegacyMembers ?? []
  const memberIds = rawList.filter((mid): mid is string => typeof mid === 'string')
  const legacy = x as Partial<StudioServiceGroup> & {
    priceFrom?: string
    priceTo?: string
    currency?: string
    priceUnit?: string
    durationNote?: string
  }
  const pricing = normalizeCommercialPriceTiers(x, legacy, x.title ?? '')
  return {
    id: x.id,
    title: x.title ?? '',
    description: x.description ?? '',
    bannerDataUrl:
      typeof x.bannerDataUrl === 'string' && x.bannerDataUrl.length > 0 ? x.bannerDataUrl : null,
    bannerPortraitDataUrl:
      typeof x.bannerPortraitDataUrl === 'string' && x.bannerPortraitDataUrl.length > 0
        ? x.bannerPortraitDataUrl
        : null,
    externalUrl: typeof x.externalUrl === 'string' ? x.externalUrl : '',
    memberIds,
    priceTiers: pricing.priceTiers,
    activePriceTierId: pricing.activePriceTierId,
    linkedToolIds: Array.isArray(x.linkedToolIds)
      ? x.linkedToolIds.filter((tid): tid is string => typeof tid === 'string')
      : [],
  }
}

function normalizeReview(raw: unknown): StudioReview | null {
  if (!raw || typeof raw !== 'object') return null
  const x = raw as Partial<StudioReview>
  if (typeof x.id !== 'string') return null
  const legacy = x as Partial<StudioReview> & { body?: string }
  const legacyBody = typeof legacy.body === 'string' ? legacy.body : ''
  const bodyBig = typeof legacy.bodyBig === 'string' ? legacy.bodyBig : legacyBody
  const bodyShort = typeof legacy.bodyShort === 'string' ? legacy.bodyShort : ''
  let rating: number | null = null
  if (typeof x.rating === 'number' && Number.isFinite(x.rating)) {
    const n = Math.round(x.rating)
    if (n >= 1 && n <= 5) rating = n
  }
  return {
    id: x.id,
    subheader: x.subheader ?? '',
    headline: x.headline ?? '',
    subtitle: x.subtitle ?? '',
    author: x.author ?? '',
    role: x.role ?? '',
    company: x.company ?? '',
    bodyShort,
    bodyBig,
    rating,
    portraitDataUrl:
      typeof x.portraitDataUrl === 'string' && x.portraitDataUrl.length > 0 ? x.portraitDataUrl : null,
    portraitPortraitDataUrl:
      typeof legacy.portraitPortraitDataUrl === 'string' && legacy.portraitPortraitDataUrl.length > 0
        ? legacy.portraitPortraitDataUrl
        : null,
    portraitMode: 'image',
    portraitVideoUrl: '',
    externalUrl: typeof x.externalUrl === 'string' ? x.externalUrl : '',
    linkedSegmentId:
      typeof x.linkedSegmentId === 'string' && x.linkedSegmentId.length > 0 ? x.linkedSegmentId : null,
    linkedWorkIds: Array.isArray(x.linkedWorkIds)
      ? [...new Set(x.linkedWorkIds.filter((wid): wid is string => typeof wid === 'string'))].slice(
          0,
          STUDIO_WORK_TEXT_LIMITS.maxLinkedWorksPerReview,
        )
      : [],
    linkedServiceGroupId:
      typeof x.linkedServiceGroupId === 'string' && x.linkedServiceGroupId.length > 0
        ? x.linkedServiceGroupId
        : null,
    linkedCatalogIds: Array.isArray(x.linkedCatalogIds)
      ? [...new Set(x.linkedCatalogIds.filter((cid): cid is string => typeof cid === 'string'))].slice(
          0,
          STUDIO_WORK_TEXT_LIMITS.maxLinkedCatalogIds,
        )
      : [],
  }
}

function emptyGalleryVisualGrid(): VisualGridProps {
  const b = createEmptyBlock('visual_grid')
  if (b.type !== 'visual_grid') {
    throw new Error('createEmptyBlock(visual_grid) invariant')
  }
  return b.props
}

function migrateLegacyGalleryUrlsToVisualGrid(urls: string[]): VisualGridProps {
  const clean = urls.map((u) => u.trim()).filter(Boolean)
  if (clean.length === 0) return emptyGalleryVisualGrid()
  return {
    sectionTitle: '',
    rows: [
      {
        id: newId(),
        cells: clean.map((imageUrl) => ({
          id: newId(),
          kind: 'image' as const,
          imageUrl,
          imageAspect: 'portrait' as const,
        })),
      },
    ],
  }
}

function normalizeGalleryVisualGrid(rawGrid: unknown, legacyUrls: string[]): VisualGridProps {
  const parsed = visualGridProps.safeParse(rawGrid)
  if (parsed.success) return parsed.data
  if (legacyUrls.length > 0) return migrateLegacyGalleryUrlsToVisualGrid(legacyUrls)
  return emptyGalleryVisualGrid()
}

function normalizeWork(raw: unknown, validCatalogIds: Set<string>): StudioWork | null {
  if (!raw || typeof raw !== 'object') return null
  const x = raw as Partial<StudioWork>
  if (typeof x.id !== 'string') return null
  const MAX_LINKED = STUDIO_WORK_TEXT_LIMITS.maxLinkedCatalogIds
  const rawLinked = Array.isArray(x.linkedCatalogIds)
    ? x.linkedCatalogIds.filter((id): id is string => typeof id === 'string' && validCatalogIds.has(id))
    : []
  const linkedCatalogIds = rawLinked.slice(0, MAX_LINKED)
  const legacyGallery = Array.isArray((x as { galleryDataUrls?: unknown }).galleryDataUrls)
    ? (x as { galleryDataUrls: unknown[] }).galleryDataUrls.filter((u): u is string => typeof u === 'string')
    : []
  const galleryVisualGrid = normalizeGalleryVisualGrid(x.galleryVisualGrid, legacyGallery)
  return {
    id: x.id,
    publicationStatus: coerceStudioWorkPublicationStatus(x.publicationStatus),
    title: x.title ?? '',
    subheader: x.subheader ?? '',
    headline: x.headline ?? '',
    subtitle: x.subtitle ?? '',
    categoryLabel: x.categoryLabel ?? '',
    clientName: x.clientName ?? '',
    locationLabel: x.locationLabel ?? '',
    description: x.description ?? '',
    taskBody: x.taskBody ?? '',
    timeline: x.timeline ?? '',
    tags: x.tags ?? '',
    linkedCatalogIds,
    bannerDataUrl: x.bannerDataUrl === null || typeof x.bannerDataUrl === 'string' ? x.bannerDataUrl : null,
    bannerPortraitDataUrl:
      x.bannerPortraitDataUrl === null || typeof x.bannerPortraitDataUrl === 'string'
        ? x.bannerPortraitDataUrl
        : null,
    galleryVisualGrid,
    videoUrl: '',
    caseUrl: x.caseUrl ?? '',
    linkedToolIds: Array.isArray((x as { linkedToolIds?: unknown }).linkedToolIds)
      ? ((x as { linkedToolIds: unknown[] }).linkedToolIds.filter(
          (tid): tid is string => typeof tid === 'string',
        ) as string[])
      : [],
    featured: Boolean(x.featured),
  }
}

function normalizeTool(raw: unknown): StudioTool | null {
  if (!raw || typeof raw !== 'object') return null
  const x = raw as Partial<StudioTool>
  if (typeof x.id !== 'string') return null
  const category: StudioToolCategory =
    typeof x.category === 'string' && (STUDIO_TOOL_CATEGORIES as readonly string[]).includes(x.category)
      ? (x.category as StudioToolCategory)
      : 'other'
  return {
    id: x.id,
    name: typeof x.name === 'string' ? x.name : '',
    vendor: typeof x.vendor === 'string' ? x.vendor : '',
    category,
    summary: typeof x.summary === 'string' ? x.summary : '',
    description: typeof x.description === 'string' ? x.description : '',
    externalUrl: typeof x.externalUrl === 'string' ? x.externalUrl : '',
    iconDataUrl:
      typeof x.iconDataUrl === 'string' && x.iconDataUrl.length > 0 ? x.iconDataUrl : null,
    iconPortraitDataUrl:
      typeof x.iconPortraitDataUrl === 'string' && x.iconPortraitDataUrl.length > 0
        ? x.iconPortraitDataUrl
        : null,
    featured: Boolean(x.featured),
  }
}

function normalizeProduct(
  raw: unknown,
  validCatalogIds: Set<string>,
  validWorkIds: Set<string>,
  validGroupIds: Set<string>,
): StudioProduct | null {
  if (!raw || typeof raw !== 'object') return null
  const x = raw as Partial<StudioProduct>
  if (typeof x.id !== 'string') return null
  const billingKind: StudioProductBillingKind =
    typeof x.billingKind === 'string' &&
    (STUDIO_PRODUCT_BILLING_KINDS as readonly string[]).includes(x.billingKind)
      ? (x.billingKind as StudioProductBillingKind)
      : 'package'
  return {
    id: x.id,
    title: typeof x.title === 'string' ? x.title : '',
    summary: typeof x.summary === 'string' ? x.summary : '',
    description: typeof x.description === 'string' ? x.description : '',
    code: typeof x.code === 'string' ? x.code : '',
    priceAmount: typeof x.priceAmount === 'string' ? x.priceAmount : '',
    priceFrom: typeof x.priceFrom === 'string' ? x.priceFrom : '',
    priceTo: typeof x.priceTo === 'string' ? x.priceTo : '',
    billingKind,
    inclusions: typeof x.inclusions === 'string' ? x.inclusions : '',
    externalUrl: typeof x.externalUrl === 'string' ? x.externalUrl : '',
    bannerDataUrl:
      typeof x.bannerDataUrl === 'string' && x.bannerDataUrl.length > 0 ? x.bannerDataUrl : null,
    bannerPortraitDataUrl:
      typeof x.bannerPortraitDataUrl === 'string' && x.bannerPortraitDataUrl.length > 0
        ? x.bannerPortraitDataUrl
        : null,
    linkedCatalogIds: Array.isArray(x.linkedCatalogIds)
      ? x.linkedCatalogIds.filter(
          (cid): cid is string => typeof cid === 'string' && validCatalogIds.has(cid),
        )
      : [],
    linkedWorkIds: Array.isArray(x.linkedWorkIds)
      ? x.linkedWorkIds.filter(
          (wid): wid is string => typeof wid === 'string' && validWorkIds.has(wid),
        )
      : [],
    linkedServiceGroupId:
      typeof x.linkedServiceGroupId === 'string' && validGroupIds.has(x.linkedServiceGroupId)
        ? x.linkedServiceGroupId
        : null,
    featured: Boolean(x.featured),
  }
}

function pruneMembers(groups: StudioServiceGroup[], removedId: string): StudioServiceGroup[] {
  return groups.map((g) => ({
    ...g,
    memberIds: g.memberIds.filter((mid) => mid !== removedId),
  }))
}

export const useStudioProfileStore = create<StudioProfileState>()(
  (set) => ({
    general: initialGeneral(),
    serviceCatalog: [],
    serviceGroups: [],
    segments: [],
    works: [],
    reviews: [],
    tools: [],
    products: [],

      setGeneral: (patch) =>
        set((s) => ({
          general: { ...s.general, ...patch },
        })),

      addOffice: () => {
        const office = createEmptyOffice()
        set((s) => ({
          general: { ...s.general, studioOffices: [office, ...s.general.studioOffices] },
        }))
        return office.id
      },

      updateOffice: (id, patch) =>
        set((s) => ({
          general: {
            ...s.general,
            studioOffices: s.general.studioOffices.map((o) =>
              o.id === id ? { ...o, ...patch } : o,
            ),
          },
        })),

      removeOffice: (id) =>
        set((s) => ({
          general: {
            ...s.general,
            studioOffices: s.general.studioOffices.filter((o) => o.id !== id),
          },
        })),

      reorderOffices: (ids) =>
        set((s) => {
          const map = new Map(s.general.studioOffices.map((o) => [o.id, o]))
          const next = ids
            .map((i) => map.get(i))
            .filter((x): x is StudioOffice => x !== undefined)
          return { general: { ...s.general, studioOffices: next } }
        }),

      addBankAccount: () => {
        const id = newId()
        set((s) => {
          const existing = s.general.bankAccounts
          const isFirst = existing.length === 0
          const fallbackCurrency = existing[0]?.currency ?? s.general.displayCurrency
          const next = [createEmptyStudioBankAccount(id, fallbackCurrency, isFirst), ...existing]
          return { general: { ...s.general, bankAccounts: next } }
        })
        return id
      },

      updateBankAccount: (id, patch) =>
        set((s) => ({
          general: {
            ...s.general,
            bankAccounts: s.general.bankAccounts.map((b) => (b.id === id ? { ...b, ...patch } : b)),
          },
        })),

      removeBankAccount: (id) =>
        set((s) => {
          const remaining = s.general.bankAccounts.filter((b) => b.id !== id)
          if (remaining.length > 0 && !remaining.some((b) => b.isDefault)) {
            remaining[0] = { ...remaining[0], isDefault: true }
          }
          return { general: { ...s.general, bankAccounts: remaining } }
        }),

      setDefaultBankAccount: (id) =>
        set((s) => ({
          general: {
            ...s.general,
            bankAccounts: s.general.bankAccounts.map((b) => ({ ...b, isDefault: b.id === id })),
          },
        })),

      reorderBankAccounts: (ids) =>
        set((s) => {
          const map = new Map(s.general.bankAccounts.map((b) => [b.id, b]))
          const next = ids
            .map((i) => map.get(i))
            .filter((b): b is StudioBankAccount => b !== undefined)
          return { general: { ...s.general, bankAccounts: next } }
        }),

      addDocumentTemplate: (kind) => {
        const id = newId()
        set((s) => {
          const hasDefault = s.general.documentTemplates.some(
            (tpl) => tpl.kind === kind && tpl.isDefault,
          )
          const fresh: StudioDocumentTemplate = {
            id,
            kind,
            name: '',
            description: '',
            isDefault: !hasDefault,
            sectionIds: [],
            defaults: {
              bankAccountId: null,
              taxModeOverride: null,
              validityDays: '',
              pricingPresetId: null,
            },
          }
          return {
            general: { ...s.general, documentTemplates: [fresh, ...s.general.documentTemplates] },
          }
        })
        return id
      },

      updateDocumentTemplate: (id, patch) =>
        set((s) => ({
          general: {
            ...s.general,
            documentTemplates: s.general.documentTemplates.map((tpl) =>
              tpl.id === id ? { ...tpl, ...patch } : tpl,
            ),
          },
        })),

      removeDocumentTemplate: (id) =>
        set((s) => {
          const target = s.general.documentTemplates.find((tpl) => tpl.id === id)
          const remaining = s.general.documentTemplates.filter((tpl) => tpl.id !== id)
          if (target?.isDefault) {
            const firstOfKindIdx = remaining.findIndex((tpl) => tpl.kind === target.kind)
            if (firstOfKindIdx >= 0) {
              remaining[firstOfKindIdx] = { ...remaining[firstOfKindIdx], isDefault: true }
            }
          }
          return { general: { ...s.general, documentTemplates: remaining } }
        }),

      setDefaultDocumentTemplate: (id) =>
        set((s) => {
          const target = s.general.documentTemplates.find((tpl) => tpl.id === id)
          if (!target) return s
          return {
            general: {
              ...s.general,
              documentTemplates: s.general.documentTemplates.map((tpl) => ({
                ...tpl,
                isDefault: tpl.kind === target.kind ? tpl.id === id : tpl.isDefault,
              })),
            },
          }
        }),

      reorderDocumentTemplates: (ids) =>
        set((s) => {
          const map = new Map(s.general.documentTemplates.map((tpl) => [tpl.id, tpl]))
          const next = ids
            .map((i) => map.get(i))
            .filter((tpl): tpl is StudioDocumentTemplate => tpl !== undefined)
          return { general: { ...s.general, documentTemplates: next } }
        }),

      addCatalogItem: () => {
        const id = newId()
        const tier = createEmptyPriceTier()
        set((s) => ({
          serviceCatalog: [
            {
              id,
              title: '',
              description: '',
              summary: '',
              code: '',
              priceTiers: [tier],
              activePriceTierId: tier.id,
              externalUrl: '',
              mediaMode: 'image',
              mediaDataUrl: null,
              mediaPortraitDataUrl: null,
              mediaVideoUrl: '',
              linkedWorkId: null,
              linkedToolIds: [],
            },
            ...s.serviceCatalog,
          ],
        }))
        return id
      },

      updateCatalogItem: (id, patch) =>
        set((s) => ({
          serviceCatalog: s.serviceCatalog.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),

      removeCatalogItem: (id) =>
        set((s) => ({
          serviceCatalog: s.serviceCatalog.filter((c) => c.id !== id),
          serviceGroups: pruneMembers(s.serviceGroups, id),
          works: s.works.map((w) => ({
            ...w,
            linkedCatalogIds: w.linkedCatalogIds.filter((cid) => cid !== id),
          })),
          reviews: s.reviews.map((r) => ({
            ...r,
            linkedCatalogIds: r.linkedCatalogIds.filter((cid) => cid !== id),
          })),
          products: s.products.map((p) => ({
            ...p,
            linkedCatalogIds: p.linkedCatalogIds.filter((cid) => cid !== id),
          })),
        })),

      reorderCatalog: (ids) =>
        set((s) => {
          const map = new Map(s.serviceCatalog.map((c) => [c.id, c]))
          const next = ids.map((i) => map.get(i)).filter(Boolean) as StudioServiceCatalogItem[]
          return { serviceCatalog: next }
        }),

      addServiceGroup: () => {
        const id = newId()
        const tier = createEmptyPriceTier()
        set((s) => ({
          serviceGroups: [
            ...s.serviceGroups,
            {
              id,
              title: '',
              description: '',
              bannerDataUrl: null,
              bannerPortraitDataUrl: null,
              externalUrl: '',
              memberIds: [],
              priceTiers: [tier],
              activePriceTierId: tier.id,
              linkedToolIds: [],
            },
          ],
        }))
        return id
      },

      updateServiceGroup: (id, patch) =>
        set((s) => ({
          serviceGroups: s.serviceGroups.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        })),

      appendServiceGroupMember: (groupId, catalogLineId) =>
        set((s) => ({
          serviceGroups: s.serviceGroups.map((g) => {
            if (g.id !== groupId) return g
            if (g.memberIds.includes(catalogLineId)) return g
            return { ...g, memberIds: [catalogLineId, ...g.memberIds] }
          }),
        })),

      toggleServiceGroupMember: (groupId, catalogLineId) =>
        set((s) => ({
          serviceGroups: s.serviceGroups.map((g) => {
            if (g.id !== groupId) return g
            const has = g.memberIds.includes(catalogLineId)
            return {
              ...g,
              memberIds: has
                ? g.memberIds.filter((mid) => mid !== catalogLineId)
                : [catalogLineId, ...g.memberIds],
            }
          }),
        })),

      removeServiceGroup: (id) =>
        set((s) => ({
          serviceGroups: s.serviceGroups.filter((g) => g.id !== id),
          reviews: s.reviews.map((r) =>
            r.linkedServiceGroupId === id ? { ...r, linkedServiceGroupId: null } : r,
          ),
          products: s.products.map((p) =>
            p.linkedServiceGroupId === id ? { ...p, linkedServiceGroupId: null } : p,
          ),
        })),

      reorderServiceGroups: (ids) =>
        set((s) => {
          const map = new Map(s.serviceGroups.map((g) => [g.id, g]))
          const next = ids.map((i) => map.get(i)).filter(Boolean) as StudioServiceGroup[]
          return { serviceGroups: next }
        }),

      addSegment: () => {
        const id = newId()
        set((s) => ({
          segments: [
            ...s.segments,
            {
              id,
              title: '',
              subheader: '',
              headline: '',
              subtitle: '',
              description: '',
              bannerDataUrl: null,
              bannerPortraitDataUrl: null,
              bannerMode: 'image',
              bannerVideoUrl: '',
              externalUrl: '',
              linkedCatalogIds: [],
              linkedWorkIds: [],
            },
          ],
        }))
        return id
      },

      updateSegment: (id, patch) =>
        set((s) => ({
          segments: s.segments.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),

      removeSegment: (id) =>
        set((s) => ({
          segments: s.segments.filter((x) => x.id !== id),
          reviews: s.reviews.map((r) =>
            r.linkedSegmentId === id ? { ...r, linkedSegmentId: null } : r,
          ),
        })),

      reorderSegments: (ids) =>
        set((s) => {
          const map = new Map(s.segments.map((x) => [x.id, x]))
          const next = ids.map((i) => map.get(i)).filter(Boolean) as StudioSegment[]
          return { segments: next }
        }),

      addWork: () => {
        const id = newId()
        set((s) => ({
          works: [
            ...s.works,
            {
              id,
              publicationStatus: 'draft',
              title: '',
              subheader: '',
              headline: '',
              subtitle: '',
              categoryLabel: '',
              clientName: '',
              locationLabel: '',
              description: '',
              taskBody: '',
              timeline: '',
              tags: '',
              linkedCatalogIds: [],
              bannerDataUrl: null,
              bannerPortraitDataUrl: null,
              galleryVisualGrid: emptyGalleryVisualGrid(),
              videoUrl: '',
              caseUrl: '',
              linkedToolIds: [],
              featured: false,
            },
          ],
        }))
        return id
      },

      updateWork: (id, patch) =>
        set((s) => ({
          works: s.works.map((w) => (w.id === id ? { ...w, ...patch } : w)),
        })),

      removeWork: (id) =>
        set((s) => ({
          works: s.works.filter((w) => w.id !== id),
          serviceCatalog: s.serviceCatalog.map((c) =>
            c.linkedWorkId === id ? { ...c, linkedWorkId: null } : c,
          ),
          reviews: s.reviews.map((r) => ({
            ...r,
            linkedWorkIds: r.linkedWorkIds.filter((wid) => wid !== id),
          })),
          segments: s.segments.map((seg) => ({
            ...seg,
            linkedWorkIds: seg.linkedWorkIds.filter((wid) => wid !== id),
          })),
          products: s.products.map((p) => ({
            ...p,
            linkedWorkIds: p.linkedWorkIds.filter((wid) => wid !== id),
          })),
        })),

      reorderWorks: (ids) =>
        set((s) => {
          const map = new Map(s.works.map((w) => [w.id, w]))
          const next = ids.map((i) => map.get(i)).filter(Boolean) as StudioWork[]
          return { works: next }
        }),

      addReview: () => {
        const id = newId()
        set((s) => ({
          reviews: [
            ...s.reviews,
            {
              id,
              subheader: '',
              headline: '',
              subtitle: '',
              author: '',
              role: '',
              company: '',
              bodyShort: '',
              bodyBig: '',
              rating: null,
              portraitDataUrl: null,
              portraitPortraitDataUrl: null,
              portraitMode: 'image',
              portraitVideoUrl: '',
              externalUrl: '',
              linkedSegmentId: null,
              linkedWorkIds: [],
              linkedServiceGroupId: null,
              linkedCatalogIds: [],
            },
          ],
        }))
        return id
      },

      updateReview: (id, patch) =>
        set((s) => ({
          reviews: s.reviews.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),

      removeReview: (id) =>
        set((s) => ({
          reviews: s.reviews.filter((r) => r.id !== id),
        })),

      reorderReviews: (ids) =>
        set((s) => {
          const map = new Map(s.reviews.map((r) => [r.id, r]))
          const next = ids.map((i) => map.get(i)).filter(Boolean) as StudioReview[]
          return { reviews: next }
        }),

      addTool: () => {
        const id = newId()
        set((s) => ({
          tools: [
            {
              id,
              name: '',
              vendor: '',
              category: 'render_engine',
              summary: '',
              description: '',
              externalUrl: '',
              iconDataUrl: null,
              iconPortraitDataUrl: null,
              featured: false,
            },
            ...s.tools,
          ],
        }))
        return id
      },

      updateTool: (id, patch) =>
        set((s) => ({
          tools: s.tools.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),

      removeTool: (id) =>
        set((s) => ({
          tools: s.tools.filter((t) => t.id !== id),
          works: s.works.map((w) => ({
            ...w,
            linkedToolIds: w.linkedToolIds.filter((tid) => tid !== id),
          })),
          serviceGroups: s.serviceGroups.map((g) => ({
            ...g,
            linkedToolIds: (g.linkedToolIds ?? []).filter((tid) => tid !== id),
          })),
          serviceCatalog: s.serviceCatalog.map((c) => ({
            ...c,
            linkedToolIds: (c.linkedToolIds ?? []).filter((tid) => tid !== id),
          })),
        })),

      reorderTools: (ids) =>
        set((s) => {
          const map = new Map(s.tools.map((t) => [t.id, t]))
          const next = ids.map((i) => map.get(i)).filter(Boolean) as StudioTool[]
          return { tools: next }
        }),

      addProduct: () => {
        const id = newId()
        set((s) => ({
          products: [
            {
              id,
              title: '',
              summary: '',
              description: '',
              code: '',
              priceAmount: '',
              priceFrom: '',
              priceTo: '',
              billingKind: 'package',
              inclusions: '',
              externalUrl: '',
              bannerDataUrl: null,
              bannerPortraitDataUrl: null,
              linkedCatalogIds: [],
              linkedWorkIds: [],
              linkedServiceGroupId: null,
              featured: false,
            },
            ...s.products,
          ],
        }))
        return id
      },

      updateProduct: (id, patch) =>
        set((s) => ({
          products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

      removeProduct: (id) =>
        set((s) => ({
          products: s.products.filter((p) => p.id !== id),
        })),

      reorderProducts: (ids) =>
        set((s) => {
          const map = new Map(s.products.map((p) => [p.id, p]))
          const next = ids.map((i) => map.get(i)).filter(Boolean) as StudioProduct[]
          return { products: next }
        }),

    hydrateFromServer: (payload) =>
      set((current) =>
        mergeServerStudioProfile(payload as Partial<StudioProfileState>, current),
      ),
  }),
)

function coerceFiniteLatLng(value: unknown, min: number, max: number): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  if (value < min || value > max) return null
  return value
}

function normalizeStudioOffices(raw: unknown): StudioOffice[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((r) => {
      if (!r || typeof r !== 'object') return null
      const x = r as Partial<StudioOffice>
      if (typeof x.id !== 'string') return null
      const kind: StudioOfficeKind =
        x.kind === 'virtual' || x.kind === 'legal_registered' ? x.kind : 'physical'
      return {
        id: x.id,
        label: typeof x.label === 'string' ? x.label : '',
        city: typeof x.city === 'string' ? x.city : '',
        addressLine: typeof x.addressLine === 'string' ? x.addressLine : '',
        postalCode: typeof x.postalCode === 'string' ? x.postalCode : '',
        kind,
        contactName: typeof x.contactName === 'string' ? x.contactName : '',
        contactEmail: typeof x.contactEmail === 'string' ? x.contactEmail : '',
        contactPhone: typeof x.contactPhone === 'string' ? x.contactPhone : '',
        notes: typeof x.notes === 'string' ? x.notes : '',
        coverImageDataUrl:
          typeof x.coverImageDataUrl === 'string' && x.coverImageDataUrl.length > 0
            ? x.coverImageDataUrl
            : null,
        secondaryImageDataUrl:
          typeof x.secondaryImageDataUrl === 'string' && x.secondaryImageDataUrl.length > 0
            ? x.secondaryImageDataUrl
            : null,
        latitude: coerceFiniteLatLng(x.latitude, -90, 90),
        longitude: coerceFiniteLatLng(x.longitude, -180, 180),
      }
    })
    .filter((x): x is StudioOffice => x !== null)
}

function createEmptyOffice(): StudioOffice {
  return {
    id: newId(),
    label: '',
    city: '',
    addressLine: '',
    postalCode: '',
    kind: 'physical',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    notes: '',
    coverImageDataUrl: null,
    secondaryImageDataUrl: null,
    latitude: null,
    longitude: null,
  }
}

/**
 * Merge a server payload into the current in-memory store. Server is the
 * source of truth; missing fields fall back to the current state. Renamed
 * from `mergePersistedStudioProfile` after the 2026-05-21 data loss to make
 * it explicit that this is NOT a localStorage rehydrate (we don't persist
 * server data on the client anymore — see `useStudioSettingsQuery`).
 */
function mergeServerStudioProfile(
  persistedState: unknown,
  currentState: StudioProfileState,
): StudioProfileState {
  const p = persistedState as Partial<StudioProfileState> | null
  if (!p) return currentState

  const mergedCatalog = Array.isArray(p.serviceCatalog)
    ? p.serviceCatalog
        .map(normalizeCatalogItem)
        .filter((x): x is StudioServiceCatalogItem => x !== null)
    : currentState.serviceCatalog

  const mergedGroups = Array.isArray(p.serviceGroups)
    ? p.serviceGroups
        .map(normalizeServiceGroup)
        .filter((x): x is StudioServiceGroup => x !== null)
    : currentState.serviceGroups

  const catalogIdSet = new Set(mergedCatalog.map((c) => c.id))
  const mergedWorks = Array.isArray(p.works)
    ? p.works.map((w) => normalizeWork(w, catalogIdSet)).filter((x): x is StudioWork => x !== null)
    : currentState.works

  const workIdSet = new Set(mergedWorks.map((w) => w.id))
  const groupIdSet = new Set(mergedGroups.map((g) => g.id))
  const maxWorksPerReview = STUDIO_WORK_TEXT_LIMITS.maxLinkedWorksPerReview

  const mergedReviews = Array.isArray(p.reviews)
    ? p.reviews
        .map(normalizeReview)
        .filter((x): x is StudioReview => x !== null)
        .map((r) => ({
          ...r,
          linkedCatalogIds: r.linkedCatalogIds.filter((cid) => catalogIdSet.has(cid)),
          linkedWorkIds: r.linkedWorkIds.filter((wid) => workIdSet.has(wid)).slice(0, maxWorksPerReview),
          linkedServiceGroupId:
            r.linkedServiceGroupId && groupIdSet.has(r.linkedServiceGroupId) ? r.linkedServiceGroupId : null,
        }))
    : currentState.reviews

  const general = mergePersistedGeneral(p.general as Partial<StudioGeneral> | undefined)

  const mergedSegments = Array.isArray(p.segments)
    ? p.segments
        .map((raw): StudioSegment | null => {
          if (!raw || typeof raw !== 'object' || typeof (raw as StudioSegment).id !== 'string') return null
          const x = raw as Partial<StudioSegment>
          return {
            ...x,
            id: x.id!,
            title: x.title ?? '',
            subheader: x.subheader ?? '',
            headline: x.headline ?? '',
            subtitle: x.subtitle ?? '',
            description: x.description ?? '',
            bannerDataUrl: x.bannerDataUrl === null || typeof x.bannerDataUrl === 'string' ? x.bannerDataUrl : null,
            bannerPortraitDataUrl:
              x.bannerPortraitDataUrl === null || typeof x.bannerPortraitDataUrl === 'string'
                ? x.bannerPortraitDataUrl
                : null,
            bannerMode: 'image',
            bannerVideoUrl: '',
            externalUrl: typeof x.externalUrl === 'string' ? x.externalUrl : '',
            linkedCatalogIds: Array.isArray(x.linkedCatalogIds)
              ? x.linkedCatalogIds.filter((cid): cid is string => typeof cid === 'string')
              : [],
            linkedWorkIds: Array.isArray(x.linkedWorkIds)
              ? [...new Set(x.linkedWorkIds.filter((wid): wid is string => typeof wid === 'string'))].slice(
                  0,
                  STUDIO_WORK_TEXT_LIMITS.maxLinkedWorksPerSegment,
                )
              : [],
          }
        })
        .filter((x): x is StudioSegment => x !== null)
        .map((seg) => ({
          ...seg,
          linkedCatalogIds: seg.linkedCatalogIds.filter((cid) => catalogIdSet.has(cid)),
          linkedWorkIds: seg.linkedWorkIds.filter((wid) => workIdSet.has(wid)),
        }))
    : currentState.segments

  const mergedTools = Array.isArray(p.tools)
    ? (p.tools as unknown[]).map(normalizeTool).filter((x): x is StudioTool => x !== null)
    : currentState.tools

  const toolIdSet = new Set(mergedTools.map((t) => t.id))

  const mergedWorksWithTools = mergedWorks.map((w) => ({
    ...w,
    linkedToolIds: (w.linkedToolIds ?? []).filter((tid) => toolIdSet.has(tid)),
  }))

  const mergedGroupsWithTools = mergedGroups.map((g) => ({
    ...g,
    linkedToolIds: (g.linkedToolIds ?? []).filter((tid) => toolIdSet.has(tid)),
  }))

  const mergedCatalogWithTools = mergedCatalog.map((c) => ({
    ...c,
    linkedToolIds: (c.linkedToolIds ?? []).filter((tid) => toolIdSet.has(tid)),
  }))

  const mergedProducts = Array.isArray(p.products)
    ? (p.products as unknown[])
        .map((raw) => normalizeProduct(raw, catalogIdSet, workIdSet, groupIdSet))
        .filter((x): x is StudioProduct => x !== null)
    : currentState.products

  return {
    ...currentState,
    ...p,
    general,
    serviceCatalog: mergedCatalogWithTools,
    serviceGroups: mergedGroupsWithTools,
    works: mergedWorksWithTools,
    reviews: mergedReviews,
    segments: mergedSegments,
    tools: mergedTools,
    products: mergedProducts,
  }
}

export function getStudioServiceGroupTitle(
  groups: StudioServiceGroup[],
  id: string,
  fallback: string,
): string {
  const g = groups.find((x) => x.id === id)
  const t = g?.title?.trim()
  return t && t.length > 0 ? t : fallback
}
