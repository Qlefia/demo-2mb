import { z } from 'zod'
import type { StudioBrandProfile, StudioGeneral } from '@/stores/studioProfileTypes'
import {
  STUDIO_DOCUMENT_SECTION_KINDS,
  STUDIO_DOCUMENT_SECTION_LOCALES,
  STUDIO_LEISTUNGSZEITRAUM_POLICIES,
  STUDIO_TAX_MODES,
  STUDIO_YEAR_RESET_POLICIES,
} from '@/stores/studioProfileTypes'
import {
  STUDIO_DISPLAY_CURRENCIES,
  STUDIO_PROPOSAL_DEFAULT_LOCALES,
  STUDIO_TIMEZONES,
} from '@/features/studio-settings/lib/studioGlobalDefaultsOptions'
import { pickSingleStudioBrand, STUDIO_BRAND_PROFILE_MAX } from '@/features/studio-settings/lib/pickSingleStudioBrand'
import {
  STUDIO_DOCUMENT_SECTION_LIMITS,
  STUDIO_DOCUMENT_SECTIONS_MAX,
  STUDIO_NUMBERING_LIMITS,
  STUDIO_PAYMENT_DEFAULTS_LIMITS,
  STUDIO_TAX_PROFILE_LIMITS,
} from '@/features/studio-settings/constants'

const s = (max: number) => z.string().max(max)

const logoRoleSchema = z.enum(['primary', 'wordmark', 'mark', 'lockup', 'other'])

const brandLogoFormSchema = z.object({
  id: z.string().min(1),
  label: s(120),
  role: logoRoleSchema,
  imageDataUrl: z.string().max(2048).nullable(),
})

const brandFontFormSchema = z.object({
  id: z.string().min(1),
  family: s(120),
  source: z.enum(['google', 'system', 'upload']),
  fontDataUrl: z.string().max(2_800_000).nullable(),
})

const brandColorFormSchema = z.object({
  id: z.string().min(1),
  hex: s(7),
  name: s(120),
})

const brandSocialFormSchema = z.object({
  id: z.string().min(1),
  label: s(80),
  url: s(500),
})

const brandProfileFormSchema = z.object({
  id: z.string().min(1),
  isPrimary: z.boolean(),
  name: s(200),
  slogan: s(500),
  description: s(20_000),
  strengthPositioning: s(20_000),
  studioPrinciples: s(20_000),
  logos: z.array(brandLogoFormSchema).max(24),
  fonts: z.array(brandFontFormSchema).max(2),
  accentFontId: z.string().nullable(),
  bodyFontId: z.string().nullable(),
  colors: z.array(brandColorFormSchema).max(24),
  socialNetworks: z.array(brandSocialFormSchema).max(16),
  voiceGuidelines: s(20_000),
  strategyNotes: s(20_000),
  businessProfile: s(20_000),
})

const taxProfileFormSchema = z.object({
  mode: z.enum(STUDIO_TAX_MODES as unknown as [string, ...string[]]),
  defaultVatRatePercent: z
    .number()
    .int()
    .min(STUDIO_TAX_PROFILE_LIMITS.vatRateMin)
    .max(STUDIO_TAX_PROFILE_LIMITS.vatRateMax),
  vatRateOptions: z
    .array(z.number().int().min(STUDIO_TAX_PROFILE_LIMITS.vatRateMin).max(STUDIO_TAX_PROFILE_LIMITS.vatRateMax))
    .max(8),
  steuernummer: s(STUDIO_TAX_PROFILE_LIMITS.steuernummer),
  ustIdNr: s(STUDIO_TAX_PROFILE_LIMITS.ustIdNr),
  kleinunternehmerNote: s(STUDIO_TAX_PROFILE_LIMITS.kleinunternehmerNote),
  reverseChargeNote: s(STUDIO_TAX_PROFILE_LIMITS.reverseChargeNote),
  showTaxModeFooterNote: z.boolean(),
})

const numberingFormSchema = z.object({
  prefix: s(STUDIO_NUMBERING_LIMITS.prefix),
  separator: s(STUDIO_NUMBERING_LIMITS.separator),
  padWidth: z
    .number()
    .int()
    .min(STUDIO_NUMBERING_LIMITS.padWidthMin)
    .max(STUDIO_NUMBERING_LIMITS.padWidthMax),
  includeYear: z.boolean(),
  yearResetPolicy: z.enum(STUDIO_YEAR_RESET_POLICIES as unknown as [string, ...string[]]),
  nextNumber: z
    .number()
    .int()
    .min(STUDIO_NUMBERING_LIMITS.nextNumberMin)
    .max(STUDIO_NUMBERING_LIMITS.nextNumberMax),
})

const paymentDefaultsFormSchema = z.object({
  netDays: z
    .number()
    .int()
    .min(STUDIO_PAYMENT_DEFAULTS_LIMITS.netDaysMin)
    .max(STUDIO_PAYMENT_DEFAULTS_LIMITS.netDaysMax),
  skontoPercent: z
    .number()
    .min(STUDIO_PAYMENT_DEFAULTS_LIMITS.skontoPercentMin)
    .max(STUDIO_PAYMENT_DEFAULTS_LIMITS.skontoPercentMax),
  skontoDays: z
    .number()
    .int()
    .min(STUDIO_PAYMENT_DEFAULTS_LIMITS.skontoDaysMin)
    .max(STUDIO_PAYMENT_DEFAULTS_LIMITS.skontoDaysMax),
  lateFeePercentPerMonth: z
    .number()
    .min(STUDIO_PAYMENT_DEFAULTS_LIMITS.lateFeePercentMin)
    .max(STUDIO_PAYMENT_DEFAULTS_LIMITS.lateFeePercentMax),
  lateFeeNote: s(STUDIO_PAYMENT_DEFAULTS_LIMITS.lateFeeNote),
  leistungszeitraumPolicy: z.enum(STUDIO_LEISTUNGSZEITRAUM_POLICIES as unknown as [string, ...string[]]),
})

const documentSectionFormSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(STUDIO_DOCUMENT_SECTION_KINDS as unknown as [string, ...string[]]),
  name: s(STUDIO_DOCUMENT_SECTION_LIMITS.name),
  body: s(STUDIO_DOCUMENT_SECTION_LIMITS.body),
  tags: z.array(s(STUDIO_DOCUMENT_SECTION_LIMITS.tag)).max(STUDIO_DOCUMENT_SECTION_LIMITS.maxTags),
  locale: z.enum(STUDIO_DOCUMENT_SECTION_LOCALES as unknown as [string, ...string[]]),
})

export const studioGeneralFormSchema = z.object({
  website: s(500),
  about: s(20_000),
  advantages: s(20_000),
  studioBrands: z.array(brandProfileFormSchema).min(1).max(STUDIO_BRAND_PROFILE_MAX),
  defaultProposalLocale: z.enum(STUDIO_PROPOSAL_DEFAULT_LOCALES as unknown as ['de', 'en', 'ru']),
  displayCurrency: z.enum(STUDIO_DISPLAY_CURRENCIES as unknown as [string, ...string[]]),
  studioTimezone: z.enum(STUDIO_TIMEZONES as unknown as [string, ...string[]]),
  defaultEmailSignOff: s(500),
  legalEntityName: s(300),
  tradingName: s(200),
  registrationDetails: s(2000),
  vatId: s(80),
  addressStreet: s(300),
  addressLine2: s(300),
  addressPostalCode: s(32),
  addressLocality: s(200),
  addressCountry: s(120),
  officePhone: s(80),
  officeEmail: s(320),
  supervisoryAuthority: s(2000),
  professionalLiabilityInsurance: s(2000),
  insuranceCoverageScope: s(2000),
  visualizationCredits: s(1000),
  signingName: s(200),
  signingRole: s(200),
  signingEmail: s(320),
  signingPhone: s(80),
  signing2Name: s(200),
  signing2Role: s(200),
  signing2Email: s(320),
  offerValidityDays: z.string().max(4).refine((v) => v === '' || /^\d{1,4}$/.test(v)),
  shareLinkValidityDays: z.string().max(4).refine((v) => v === '' || /^\d{1,4}$/.test(v)),
  defaultPaymentTerms: s(2000),
  defaultVatNote: s(500),
  defaultRevisionsNote: s(2000),
  taxProfile: taxProfileFormSchema,
  offerNumbering: numberingFormSchema,
  invoiceNumbering: numberingFormSchema,
  paymentDefaults: paymentDefaultsFormSchema,
  documentSections: z.array(documentSectionFormSchema).max(STUDIO_DOCUMENT_SECTIONS_MAX),
})

export type GeneralForm = z.infer<typeof studioGeneralFormSchema>

export function generalToFormValues(g: StudioGeneral): GeneralForm {
  return {
    website: g.website,
    about: g.about,
    advantages: g.advantages,
    studioBrands: pickSingleStudioBrand(
      g.studioBrands.map((b) => ({
        ...b,
        logos: b.logos.map((l) => ({ ...l })),
        fonts: b.fonts.map((f) => ({ ...f })),
        colors: b.colors.map((c) => ({ ...c })),
        socialNetworks: b.socialNetworks.map((n) => ({ ...n })),
      })),
    ),
    defaultProposalLocale: g.defaultProposalLocale,
    displayCurrency: g.displayCurrency,
    studioTimezone: g.studioTimezone,
    defaultEmailSignOff: g.defaultEmailSignOff,
    legalEntityName: g.legalEntityName,
    tradingName: g.tradingName,
    registrationDetails: g.registrationDetails,
    vatId: g.vatId,
    addressStreet: g.addressStreet,
    addressLine2: g.addressLine2,
    addressPostalCode: g.addressPostalCode,
    addressLocality: g.addressLocality,
    addressCountry: g.addressCountry,
    officePhone: g.officePhone,
    officeEmail: g.officeEmail,
    supervisoryAuthority: g.supervisoryAuthority,
    professionalLiabilityInsurance: g.professionalLiabilityInsurance,
    insuranceCoverageScope: g.insuranceCoverageScope,
    visualizationCredits: g.visualizationCredits,
    signingName: g.signingName,
    signingRole: g.signingRole,
    signingEmail: g.signingEmail,
    signingPhone: g.signingPhone,
    signing2Name: g.signing2Name,
    signing2Role: g.signing2Role,
    signing2Email: g.signing2Email,
    offerValidityDays: g.offerValidityDays,
    shareLinkValidityDays: g.shareLinkValidityDays,
    defaultPaymentTerms: g.defaultPaymentTerms,
    defaultVatNote: g.defaultVatNote,
    defaultRevisionsNote: g.defaultRevisionsNote,
    taxProfile: {
      ...g.taxProfile,
      vatRateOptions: [...g.taxProfile.vatRateOptions],
    },
    offerNumbering: { ...g.offerNumbering },
    invoiceNumbering: { ...g.invoiceNumbering },
    paymentDefaults: { ...g.paymentDefaults },
    documentSections: g.documentSections.map((sec) => ({ ...sec, tags: [...sec.tags] })),
  }
}

function ensureSinglePrimaryBrand(brands: StudioBrandProfile[]): StudioBrandProfile[] {
  if (brands.length === 0) return brands
  const idx = brands.findIndex((b) => b.isPrimary)
  if (idx < 0) {
    return brands.map((b, i) => (i === 0 ? { ...b, isPrimary: true } : { ...b, isPrimary: false }))
  }
  return brands.map((b, i) => (i === idx ? { ...b, isPrimary: true } : { ...b, isPrimary: false }))
}

function dedupePrimaryLogos(brand: StudioBrandProfile): StudioBrandProfile {
  let seenPrimary = false
  return {
    ...brand,
    logos: brand.logos.map((l) => {
      if (l.role !== 'primary') return l
      if (!seenPrimary) {
        seenPrimary = true
        return l
      }
      return { ...l, role: 'wordmark' }
    }),
  }
}

function ensurePrimaryLogoWhenMissing(brand: StudioBrandProfile): StudioBrandProfile {
  if (brand.logos.length === 0) return brand
  if (brand.logos.some((l) => l.role === 'primary')) return brand
  return {
    ...brand,
    logos: brand.logos.map((l, i) => (i === 0 ? { ...l, role: 'primary' } : l)),
  }
}

function preserveBrandKitFields(
  saved: StudioBrandProfile,
  existing: StudioBrandProfile | undefined,
): StudioBrandProfile {
  if (!existing) return saved
  return {
    ...saved,
    logos: existing.logos,
    fonts: existing.fonts,
    accentFontId: existing.accentFontId,
    bodyFontId: existing.bodyFontId,
    colors: existing.colors,
    socialNetworks: existing.socialNetworks,
    voiceGuidelines: existing.voiceGuidelines,
    strategyNotes: existing.strategyNotes,
    businessProfile: existing.businessProfile,
  }
}

/** Merge primary kit from General form into the full kit list (other kits unchanged). */
export function finalizeStudioBrandsForSave(
  brands: GeneralForm['studioBrands'],
  existingBrands: StudioBrandProfile[],
): StudioBrandProfile[] {
  const single = pickSingleStudioBrand(brands as StudioBrandProfile[])
  const primary = single[0]
  if (!primary) return existingBrands

  const existingPrimary = existingBrands.find((b) => b.id === primary.id)
  const saved = dedupePrimaryLogos(ensurePrimaryLogoWhenMissing(preserveBrandKitFields(primary, existingPrimary)))
  const idx = existingBrands.findIndex((b) => b.id === saved.id)
  const merged =
    idx >= 0
      ? existingBrands.map((b, i) => (i === idx ? saved : b))
      : [saved, ...existingBrands]

  return ensureSinglePrimaryBrand(merged).slice(0, STUDIO_BRAND_PROFILE_MAX)
}
