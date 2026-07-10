import type { VisualGridProps } from '@/lib/proposals/blockSchema'
import type {
  StudioDisplayCurrency,
  StudioProposalDefaultLocale,
  StudioTimezoneOption,
} from '@/features/studio-settings/lib/studioGlobalDefaultsOptions'

export type StudioHeroBannerMode = 'image' | 'video'

/** One commercial price bundle (Behance-style tiers per catalogue line or group). */
export type StudioCommercialPriceTier = {
  id: string
  name: string
  skuPostfix: string
  description: string
  revisions: string
  concepts: string
  /** Combined amount + currency, e.g. "300 €". */
  priceAmount: string
  priceFrom: string
  priceTo: string
  freeNote: string
  durationNote: string
}

export type StudioCommercialPricingHost = {
  priceTiers: StudioCommercialPriceTier[]
  activePriceTierId: string | null
}

export type StudioServiceCatalogItem = {
  id: string
  title: string
  /** Rich HTML — full pitch / scope for proposals. */
  description: string
  /** One-line teaser for tables and compact lists (plain text). */
  summary: string
  /** Internal code or SKU (plain text). */
  code: string
  priceTiers: StudioCommercialPriceTier[]
  activePriceTierId: string | null
  externalUrl: string
  /** Card media (local until sync). Video fields kept for legacy data; UI is image-only for now. */
  mediaMode: StudioHeroBannerMode
  /** Horizontal hero still (16:9). */
  mediaDataUrl: string | null
  /** Vertical / portrait still (3:4) for grids and narrow cards. */
  mediaPortraitDataUrl: string | null
  mediaVideoUrl: string
  /** Production tools (render engines etc.) used to deliver this service line. */
  linkedToolIds: string[]
  /** Optional link to a portfolio work (local profile only). */
  linkedWorkId: string | null
}

export type StudioServiceGroup = {
  id: string
  title: string
  /** Rich HTML — how this bundle reads in proposals (separate from line items). */
  description: string
  /** Optional banner for list cards and group editor (data URL, local until sync). */
  bannerDataUrl: string | null
  /** Vertical still for narrow cards and grids (3:4). */
  bannerPortraitDataUrl: string | null
  /** Optional public URL (landing page for this bundle on the studio site). */
  externalUrl: string
  /** Ordered catalog ids; one catalog entry may appear in several groups */
  memberIds: string[]
  priceTiers: StudioCommercialPriceTier[]
  activePriceTierId: string | null
  /** Production tools (render engines etc.) used in this bundle. */
  linkedToolIds: string[]
}

export type StudioSegment = {
  id: string
  title: string
  /** Optional hero lines (same semantics as studio general). */
  subheader: string
  headline: string
  subtitle: string
  description: string
  /** Horizontal 16:9 banner image (data URL until sync). */
  bannerDataUrl: string | null
  /** Vertical 3:4 secondary still. */
  bannerPortraitDataUrl: string | null
  /** @deprecated Always coerced to `'image'`; video tab removed from UI. */
  bannerMode?: StudioHeroBannerMode
  /** @deprecated Cleared on load; kept so legacy persisted rows don't break the schema. */
  bannerVideoUrl?: string
  /** Optional public URL (landing page for this audience on the studio site). */
  externalUrl: string
  /** Catalogue lines offered for this audience segment (subset of `serviceCatalog`). */
  linkedCatalogIds: string[]
  /** Portfolio case ids featured for this audience (subset of `works`). */
  linkedWorkIds: string[]
}

export const STUDIO_WORK_PUBLICATION_STATUSES = [
  'draft',
  'in_review',
  'published',
  'unpublished',
] as const

export type StudioWorkPublicationStatus = (typeof STUDIO_WORK_PUBLICATION_STATUSES)[number]

export type StudioWork = {
  id: string
  /** CMS-style visibility (Webflow-like: draft, review, live, taken down). */
  publicationStatus: StudioWorkPublicationStatus
  title: string
  subheader: string
  headline: string
  subtitle: string
  categoryLabel: string
  /** Client / developer name for proposals and list previews. */
  clientName: string
  /** City, region, or market — optional. */
  locationLabel: string
  description: string
  /** Scope / deliverables for this case (rich HTML). */
  taskBody: string
  timeline: string
  tags: string
  /** Service catalogue line ids linked to this case (subset of `serviceCatalog`). */
  linkedCatalogIds: string[]
  bannerDataUrl: string | null
  bannerPortraitDataUrl: string | null
  /** Same layout model as proposal `visual_grid` — rows of image/text cells (local data URLs). */
  galleryVisualGrid: VisualGridProps
  /** @deprecated Cleared on load; kept so legacy persisted rows don't break the schema. */
  videoUrl?: string
  /** Optional public URL (project case page on the studio site). */
  caseUrl: string
  /** Production tools used on this case (subset of `tools`). */
  linkedToolIds: string[]
  featured: boolean
}

export type StudioReview = {
  id: string
  subheader: string
  headline: string
  subtitle: string
  author: string
  role: string
  company: string
  /** Short pull-quote for cards and list previews. */
  bodyShort: string
  /** Full testimonial for proposal blocks and case pages. */
  bodyBig: string
  rating: number | null
  /** Horizontal 16:9 testimonial media. */
  portraitDataUrl: string | null
  /** Vertical 3:4 testimonial media. */
  portraitPortraitDataUrl: string | null
  /** @deprecated Local profile only — always `image`; video removed from UI. */
  portraitMode?: StudioHeroBannerMode
  /** @deprecated Cleared on load; kept for legacy persisted rows. */
  portraitVideoUrl?: string
  /** Optional public URL (source of the testimonial — video link, article, Google review). */
  externalUrl: string
  linkedSegmentId: string | null
  /** Portfolio case ids this testimonial is tied to (subset of `works`). */
  linkedWorkIds: string[]
  /** Single service bundle this quote is most associated with (subset of `serviceGroups`). */
  linkedServiceGroupId: string | null
  /** Catalogue line ids this testimonial relates to (subset of `serviceCatalog`). */
  linkedCatalogIds: string[]
}

export const STUDIO_TOOL_CATEGORIES = [
  'render_engine',
  'modeling_3d',
  'cad_bim',
  'compositing',
  'post_production',
  'motion',
  'texturing',
  'plugin',
  'other',
] as const
export type StudioToolCategory = (typeof STUDIO_TOOL_CATEGORIES)[number]

/** A production tool used by the studio (render engine, modeller, plugin) — linkable from works. */
export type StudioTool = {
  id: string
  /** Display name (e.g. "Unreal Engine", "Corona Render", "Cinema 4D"). */
  name: string
  /** Vendor / publisher (e.g. "Epic Games", "Chaos"). */
  vendor: string
  category: StudioToolCategory
  /** Studio-level note (one-line teaser shown on cards). */
  summary: string
  /** Rich HTML — how the studio uses it, version notes, internal hints. */
  description: string
  /** Optional product / vendor URL. */
  externalUrl: string
  /** Optional icon / logo (16:9 hero crop is fine). Data URL until sync. */
  iconDataUrl: string | null
  /** Optional secondary still (3:4) for grids. */
  iconPortraitDataUrl: string | null
  /** When true, surface in proposals "tools we use" sections by default. */
  featured: boolean
}

export const STUDIO_PRODUCT_BILLING_KINDS = ['one_time', 'package', 'retainer', 'hourly'] as const
export type StudioProductBillingKind = (typeof STUDIO_PRODUCT_BILLING_KINDS)[number]

/**
 * A productised offering — a fixed-scope package the studio sells (e.g. "3 exterior renders bundle").
 * Distinct from {@link StudioServiceCatalogItem} which is the atomic catalogue line; a product can
 * compose multiple catalogue lines and link to portfolio works as proof.
 */
export type StudioProduct = {
  id: string
  title: string
  /** Plain-text one-liner shown on cards and list previews. */
  summary: string
  /** Rich HTML — full pitch / scope for proposals and product page. */
  description: string
  /** Internal SKU / code. */
  code: string
  /** Headline price as displayed (combined amount + currency, e.g. "1 200 €"). */
  priceAmount: string
  /** Lower bound for ranged price (optional). */
  priceFrom: string
  /** Upper bound for ranged price (optional). */
  priceTo: string
  billingKind: StudioProductBillingKind
  /** Plain-text bullet list of what's included (one item per line). */
  inclusions: string
  /** Optional public URL (product page on the studio site). */
  externalUrl: string
  bannerDataUrl: string | null
  bannerPortraitDataUrl: string | null
  /** Catalogue lines bundled into this product (subset of `serviceCatalog`). */
  linkedCatalogIds: string[]
  /** Portfolio works shown as proof for this product (subset of `works`). */
  linkedWorkIds: string[]
  /** Optional anchor service bundle this product extends (one of `serviceGroups`). */
  linkedServiceGroupId: string | null
  /** When true, surface in proposals "featured packages" sections by default. */
  featured: boolean
}

export type StudioOfficeKind = 'physical' | 'virtual' | 'legal_registered'

export type StudioOffice = {
  id: string
  /** Short label, e.g. "Berlin HQ". */
  label: string
  city: string
  /** Street and number (single line until workspace sync adds structured address). */
  addressLine: string
  postalCode: string
  kind: StudioOfficeKind
  /** Primary contact for this office in proposals (optional). */
  contactName: string
  contactEmail: string
  contactPhone: string
  notes: string
  /** Horizontal 16:9 hero photo for the office card (data URL, local until sync). */
  coverImageDataUrl: string | null
  /** Vertical 3:4 secondary photo (interior, signage, etc.). */
  secondaryImageDataUrl: string | null
  /** Map pin coordinates (WGS84). `null` until the user drops a pin. */
  latitude: number | null
  longitude: number | null
}

export const STUDIO_BRAND_LOGO_ROLES = ['primary', 'wordmark', 'mark', 'lockup', 'other'] as const
export type StudioBrandLogoRole = (typeof STUDIO_BRAND_LOGO_ROLES)[number]

export type StudioBrandLogo = {
  id: string
  /** Optional note, e.g. "Light background" or "Lockup DE". */
  label: string
  role: StudioBrandLogoRole
  imageDataUrl: string | null
}

export const STUDIO_BRAND_FONT_SOURCES = ['google', 'system', 'upload'] as const
export type StudioBrandFontSource = (typeof STUDIO_BRAND_FONT_SOURCES)[number]

export type StudioBrandFont = {
  id: string
  family: string
  source: StudioBrandFontSource
  /** Data URL for uploaded `.ttf` / `.otf` / `.woff` / `.woff2` files. */
  fontDataUrl: string | null
}

export type StudioBrandColor = {
  id: string
  hex: string
  name: string
}

export type StudioBrandSocialLink = {
  id: string
  label: string
  url: string
}

export type StudioBrandProfile = {
  id: string
  /** Default brand when templates expect a single studio identity. */
  isPrimary: boolean
  name: string
  slogan: string
  /** Rich HTML */
  description: string
  /** Rich HTML — market strength and positioning. */
  strengthPositioning: string
  /** Rich HTML — studio principles. */
  studioPrinciples: string
  logos: StudioBrandLogo[]
  /** Brand kit — typography stack for proposals / social templates. */
  fonts: StudioBrandFont[]
  /** Accent / display face for headings (references {@link fonts}). */
  accentFontId: string | null
  /** Body copy face (references {@link fonts}). */
  bodyFontId: string | null
  /** Brand kit — palette tokens (#RRGGBB). */
  colors: StudioBrandColor[]
  /** Brand kit — social / portfolio URLs. */
  socialNetworks: StudioBrandSocialLink[]
  /** Brand kit — tone of voice (rich HTML). */
  voiceGuidelines: string
  /** Brand kit — positioning / strategy notes (rich HTML). */
  strategyNotes: string
  /** Brand kit — business profile for AI / proposals (rich HTML). */
  businessProfile: string
}

/** One bank account for invoice footers (multi-account; exactly one is `isDefault`). */
export type StudioBankAccount = {
  id: string
  /** Short label visible to the user (e.g. "Sparkasse main"). */
  label: string
  /** Account holder shown on the invoice (legal name or trading). */
  holderName: string
  /** IBAN (uppercase, no spaces; validated client-side via mod-97). */
  iban: string
  /** BIC / SWIFT (optional in DE for SEPA but required for cross-border). */
  bic: string
  /** Human-readable bank name shown next to the IBAN. */
  bankName: string
  /** ISO 4217 currency code (uppercase). */
  currency: string
  /** Default bank used when a document has no explicit pick (exactly one per workspace). */
  isDefault: boolean
  /** Free note (optional), e.g. "for non-EU clients". */
  note: string
}

export const STUDIO_TAX_MODES = ['regular_vat', 'kleinunternehmer', 'reverse_charge'] as const
export type StudioTaxMode = (typeof STUDIO_TAX_MODES)[number]

/** Tax profile drives whether VAT lines render, what wording goes on the footer, and the default rate. */
export type StudioTaxProfile = {
  mode: StudioTaxMode
  /** Default VAT rate (percent, integer 0..99) used when a line item omits its own rate. */
  defaultVatRatePercent: number
  /** Quick-pick rates (percent, integer). Order = picker order. */
  vatRateOptions: number[]
  /** German "Steuernummer" (separate from VAT-ID — required on §14 UStG invoices). */
  steuernummer: string
  /** USt-IdNr. / EU VAT-ID (e.g. DE235615685). Supersedes the deprecated `vatId` field. */
  ustIdNr: string
  /** Footer note for §19 Kleinunternehmer (no VAT). */
  kleinunternehmerNote: string
  /** Footer note for §13b reverse-charge invoices. */
  reverseChargeNote: string
  /** When true, the small-business / reverse-charge footer paragraph is added to invoices. */
  showTaxModeFooterNote: boolean
}

export const STUDIO_YEAR_RESET_POLICIES = ['never', 'calendar'] as const
export type StudioYearResetPolicy = (typeof STUDIO_YEAR_RESET_POLICIES)[number]

/** Numbering scheme for offers and invoices (separate counters per document type). */
export type StudioDocumentNumbering = {
  /** Prefix shown before the year/number (e.g. "INV"). */
  prefix: string
  /** Separator between prefix, year, and number (e.g. "-" → "INV-2026-0042"). */
  separator: string
  /** Zero-pad width for the sequence number (1..8). */
  padWidth: number
  /** Whether to include the year segment between prefix and number. */
  includeYear: boolean
  /** When `calendar`, the counter resets to 1 at the start of each calendar year. */
  yearResetPolicy: StudioYearResetPolicy
  /** Next sequence number to assign (1-based). */
  nextNumber: number
}

export const STUDIO_LEISTUNGSZEITRAUM_POLICIES = ['invoice_date', 'delivery_date', 'custom'] as const
export type StudioLeistungszeitraumPolicy = (typeof STUDIO_LEISTUNGSZEITRAUM_POLICIES)[number]

/** Payment defaults applied to new offers / invoices unless a template overrides them. */
export type StudioPaymentDefaults = {
  /** Net payment window in days (Zahlungsziel). */
  netDays: number
  /** Cash discount (Skonto) percent within `skontoDays`. */
  skontoPercent: number
  /** Days inside which Skonto applies. */
  skontoDays: number
  /** Late-fee rate per month (percent). */
  lateFeePercentPerMonth: number
  /** Free-text late-fee clause for invoice footers. */
  lateFeeNote: string
  /** How the service period (Leistungszeitraum) is derived for invoices. */
  leistungszeitraumPolicy: StudioLeistungszeitraumPolicy
}

export const STUDIO_DOCUMENT_SECTION_KINDS = [
  'scope',
  'terms',
  'bank_block',
  'footer_note',
  'signatory_block',
  'cover_intro',
] as const
export type StudioDocumentSectionKind = (typeof STUDIO_DOCUMENT_SECTION_KINDS)[number]

export const STUDIO_DOCUMENT_SECTION_LOCALES = ['de', 'en', 'ru', 'any'] as const
export type StudioDocumentSectionLocale = (typeof STUDIO_DOCUMENT_SECTION_LOCALES)[number]

/** A reusable named section that can be composed into one or more document templates. */
export type StudioDocumentSection = {
  id: string
  kind: StudioDocumentSectionKind
  /** Display name in pickers and lists. */
  name: string
  /** Rich-text or markdown content (rendered as plain paragraph in PDFs until block layer is generalized). */
  body: string
  /** Free-form tags for filtering (e.g. "villa", "architects"). */
  tags: string[]
  /** Locale of the body copy. `any` = use as-is regardless of document locale. */
  locale: StudioDocumentSectionLocale
}

export const STUDIO_DOCUMENT_TEMPLATE_KINDS = ['offer', 'proposal', 'invoice'] as const
export type StudioDocumentTemplateKind = (typeof STUDIO_DOCUMENT_TEMPLATE_KINDS)[number]

/** Per-template overrides that shadow the workspace defaults when a document is generated. */
export type StudioDocumentTemplateDefaults = {
  bankAccountId: string | null
  taxModeOverride: StudioTaxMode | null
  validityDays: string
  /** Optional reference to a sales `serviceGroup` or `priceTier` used to seed pricing rows (Phase 2). */
  pricingPresetId: string | null
}

/** A named composition of section ids and per-template overrides; one default per `kind`. */
export type StudioDocumentTemplate = {
  id: string
  kind: StudioDocumentTemplateKind
  /** Display name in the template picker. */
  name: string
  /** One-line description shown under the name. */
  description: string
  /** Exactly one template per `kind` is the workspace default. */
  isDefault: boolean
  /** Ordered list of section ids; unknown ids are filtered at render time. */
  sectionIds: string[]
  defaults: StudioDocumentTemplateDefaults
}

export type StudioGeneral = {
  website: string
  /** Short line above the main headline (optional). */
  subheader: string
  /** Primary headline for proposals / client-facing hero. */
  headline: string
  /** Supporting line under the headline. */
  subtitle: string
  /** One or more brand identities (e.g. house brand vs sub-brand). */
  studioBrands: StudioBrandProfile[]
  about: string
  advantages: string

  /** Default locale for generated proposal copy (de / en / ru). */
  defaultProposalLocale: StudioProposalDefaultLocale
  /** ISO 4217 currency for prices in proposals until workspace sync. */
  displayCurrency: StudioDisplayCurrency
  /** IANA timezone for dates in proposals and footers. */
  studioTimezone: StudioTimezoneOption
  /** Plain-text email sign-off (not legal signatory block). */
  defaultEmailSignOff: string

  /** Legal name for offers (e.g. GmbH). Frontend-only until workspace sync. */
  legalEntityName: string
  /** Public / trading name (e.g. 2mb.studio). */
  tradingName: string
  /** Commercial register, court, managing director — free text. */
  registrationDetails: string
  /** @deprecated Use `taxProfile.ustIdNr`; kept as a read-only alias for legacy data and merge. */
  vatId: string

  addressStreet: string
  addressLine2: string
  addressPostalCode: string
  addressLocality: string
  addressCountry: string

  officePhone: string
  officeEmail: string

  /** Trade supervisory authority (e.g. § 34c GewO broker registration). */
  supervisoryAuthority: string
  /** Insurer name and address for professional liability (Berufshaftpflicht). */
  professionalLiabilityInsurance: string
  /** Scope of liability coverage (Geltungsbereich). */
  insuranceCoverageScope: string
  /** Credits for exterior / interior visualizations on the public site. */
  visualizationCredits: string

  signingName: string
  signingRole: string
  signingEmail: string
  signingPhone: string

  signing2Name: string
  signing2Role: string
  signing2Email: string

  /** Default offer validity in calendar days (digits only, empty = unset). */
  offerValidityDays: string
  /** Public share link lifetime in calendar days (proposals + offers; empty = no expiry). */
  shareLinkValidityDays: string
  defaultPaymentTerms: string
  defaultVatNote: string
  defaultRevisionsNote: string

  /** Studio locations (physical, virtual seat, or registered legal address). Local until workspace sync. */
  studioOffices: StudioOffice[]

  /** Bank accounts available for offers / invoices (exactly one `isDefault`). */
  bankAccounts: StudioBankAccount[]
  /** Tax mode + IDs + per-mode footer notes for offers and invoices. */
  taxProfile: StudioTaxProfile
  /** Numbering scheme for offers (separate counter from invoices). */
  offerNumbering: StudioDocumentNumbering
  /** Numbering scheme for invoices. */
  invoiceNumbering: StudioDocumentNumbering
  /** Workspace-wide payment defaults (Skonto, Zahlungsziel, late-fee). */
  paymentDefaults: StudioPaymentDefaults
  /** Reusable named sections composed into document templates. */
  documentSections: StudioDocumentSection[]
  /** Named offer / proposal / invoice templates (one default per kind). */
  documentTemplates: StudioDocumentTemplate[]
}
