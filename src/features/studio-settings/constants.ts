/** Client-side cap for data URLs persisted with the studio profile (localStorage). */
export const STUDIO_PROFILE_MAX_IMAGE_BYTES = 1_800_000

export const STUDIO_BRAND_KIT_MAX_COLORS = 24
export const STUDIO_BRAND_KIT_MAX_FONTS = 2
export const STUDIO_BRAND_KIT_MAX_SOCIAL_LINKS = 16
export const STUDIO_BRAND_KIT_MAX_LOGOS = 24

/** Max size for brand font uploads stored as data URLs in the profile. */
export const STUDIO_FONT_UPLOAD_MAX_BYTES = 2_000_000

/** Smaller cap for dual 16:9 + 3:4 pairs (reviews, works, groups, catalogue). */
export const STUDIO_PROFILE_COMPACT_IMAGE_BYTES = 650_000

/** Longest edge when encoding {@link STUDIO_PROFILE_COMPACT_IMAGE_BYTES} assets. */
export const STUDIO_PROFILE_COMPACT_MAX_EDGE_PX = 1280

/** Max raw file size before client-side resize/WebP (studio profile images). */
export const STUDIO_IMAGE_UPLOAD_MAX_BYTES = 100 * 1024 * 1024

/** Longest edge (px) after resize for studio profile images. */
export const STUDIO_IMAGE_MAX_EDGE_PX = 1920

/** Max pasted URL length for studio profile video fields (segments, reviews). */
export const STUDIO_PROFILE_VIDEO_URL_MAX_CHARS = 2000

/** Plain-text excerpt length before CSS `truncate` in relations rail cards. */
export const STUDIO_RELATION_RAIL_DESC_CHARS = 96

/** Portfolio section on 2mb.studio (case-category); shown as list card eyebrow. */
export const STUDIO_WORK_PORTFOLIO_CATEGORIES = [
  'Interior',
  'Exterior',
  'Complex',
  'Branding & Website',
] as const

export type StudioWorkPortfolioCategory = (typeof STUDIO_WORK_PORTFOLIO_CATEGORIES)[number]

/** Input max lengths for studio work text (frontend-only until API sync). */
export const STUDIO_WORK_TEXT_LIMITS = {
  clientName: 160,
  locationLabel: 160,
  maxLinkedCatalogIds: 16,
  /** Portfolio works linked to one testimonial (reviews). */
  maxLinkedWorksPerReview: 16,
  /** Featured portfolio cases on an audience segment. */
  maxLinkedWorksPerSegment: 8,
} as const

/** Input max lengths for service catalogue rows (frontend-only until API sync). */
export const STUDIO_SERVICE_CATALOG_LIMITS = {
  title: 200,
  summary: 320,
  code: 80,
  externalUrl: 500,
} as const

/** Commercial price tiers on catalogue lines and service groups. */
export const STUDIO_PRICE_TIER_LIMITS = {
  maxTiers: 8,
  name: 120,
  skuPostfix: 80,
  description: 4000,
  revisions: 40,
  concepts: 40,
  priceAmount: 48,
  priceFrom: 32,
  priceTo: 32,
  freeNote: 500,
  durationNote: 160,
} as const

/** Workspace billing settings — caps for bank accounts, templates, and sections. */
export const STUDIO_BANK_ACCOUNTS_MAX = 6
export const STUDIO_DOCUMENT_SECTIONS_MAX = 30
export const STUDIO_DOCUMENT_TEMPLATES_MAX = 12

/** Field-level limits for bank account form rows. */
export const STUDIO_BANK_ACCOUNT_LIMITS = {
  label: 80,
  holderName: 200,
  iban: 34,
  bic: 11,
  bankName: 160,
  note: 500,
} as const

/** Field-level limits for tax profile / numbering / payment defaults. */
export const STUDIO_TAX_PROFILE_LIMITS = {
  steuernummer: 32,
  ustIdNr: 32,
  kleinunternehmerNote: 600,
  reverseChargeNote: 600,
  /** Allowed VAT rate range (percent). */
  vatRateMin: 0,
  vatRateMax: 99,
} as const

export const STUDIO_NUMBERING_LIMITS = {
  prefix: 12,
  separator: 4,
  padWidthMin: 1,
  padWidthMax: 8,
  nextNumberMin: 1,
  nextNumberMax: 9_999_999,
} as const

export const STUDIO_PAYMENT_DEFAULTS_LIMITS = {
  netDaysMin: 0,
  netDaysMax: 365,
  skontoPercentMin: 0,
  skontoPercentMax: 50,
  skontoDaysMin: 0,
  skontoDaysMax: 365,
  lateFeePercentMin: 0,
  lateFeePercentMax: 50,
  lateFeeNote: 500,
} as const

export const STUDIO_DOCUMENT_SECTION_LIMITS = {
  name: 120,
  body: 4000,
  maxTags: 12,
  tag: 32,
} as const

export const STUDIO_DOCUMENT_TEMPLATE_LIMITS = {
  name: 120,
  description: 300,
  maxSectionsPerTemplate: 20,
  validityDays: 4,
} as const

/** Minimal country regex map for IBAN length checks (BBAN length without country prefix + check digits). */
export const STUDIO_IBAN_COUNTRY_LENGTHS: Readonly<Record<string, number>> = {
  AT: 20,
  BE: 16,
  CH: 21,
  DE: 22,
  ES: 24,
  FR: 27,
  GB: 22,
  IE: 22,
  IT: 27,
  LI: 21,
  LU: 20,
  NL: 18,
  PL: 28,
} as const
