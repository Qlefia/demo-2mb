import {
  STUDIO_BANK_ACCOUNTS_MAX,
  STUDIO_BANK_ACCOUNT_LIMITS,
  STUDIO_DOCUMENT_SECTION_LIMITS,
  STUDIO_DOCUMENT_SECTIONS_MAX,
  STUDIO_DOCUMENT_TEMPLATE_LIMITS,
  STUDIO_DOCUMENT_TEMPLATES_MAX,
  STUDIO_NUMBERING_LIMITS,
  STUDIO_PAYMENT_DEFAULTS_LIMITS,
  STUDIO_TAX_PROFILE_LIMITS,
} from '@/features/studio-settings/constants'
import { defaultStudioBankAccounts } from '@/lib/studio/defaultBankAccounts'
import { defaultStudioDocumentSections } from '@/lib/studio/defaultDocumentSections'
import { defaultStudioDocumentTemplates } from '@/lib/studio/defaultDocumentTemplates'
import { defaultInvoiceNumbering, defaultOfferNumbering } from '@/lib/studio/defaultNumbering'
import { defaultStudioPaymentDefaults } from '@/lib/studio/defaultPaymentDefaults'
import { defaultStudioTaxProfile } from '@/lib/studio/defaultTaxProfile'
import { normalizeIban } from '@/lib/studio/ibanValidate'
import type {
  StudioBankAccount,
  StudioDocumentNumbering,
  StudioDocumentSection,
  StudioDocumentSectionKind,
  StudioDocumentSectionLocale,
  StudioDocumentTemplate,
  StudioDocumentTemplateDefaults,
  StudioDocumentTemplateKind,
  StudioLeistungszeitraumPolicy,
  StudioPaymentDefaults,
  StudioTaxMode,
  StudioTaxProfile,
  StudioYearResetPolicy,
} from '@/stores/studioProfileTypes'
import {
  STUDIO_DOCUMENT_SECTION_KINDS,
  STUDIO_DOCUMENT_SECTION_LOCALES,
  STUDIO_DOCUMENT_TEMPLATE_KINDS,
  STUDIO_LEISTUNGSZEITRAUM_POLICIES,
  STUDIO_TAX_MODES,
  STUDIO_YEAR_RESET_POLICIES,
} from '@/stores/studioProfileTypes'

function str(value: unknown, max: number, fallback = ''): string {
  if (typeof value !== 'string') return fallback
  return value.slice(0, max)
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return fallback
  const i = Math.floor(n)
  if (i < min) return min
  if (i > max) return max
  return i
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return fallback
  if (n < min) return min
  if (n > max) return max
  return n
}

function pickEnum<T extends string>(value: unknown, values: readonly T[], fallback: T): T {
  return typeof value === 'string' && (values as readonly string[]).includes(value) ? (value as T) : fallback
}

function uniqInts(values: unknown, min: number, max: number): number[] {
  if (!Array.isArray(values)) return []
  const seen = new Set<number>()
  for (const v of values) {
    const n = typeof v === 'number' ? v : Number(v)
    if (!Number.isFinite(n)) continue
    const i = Math.floor(n)
    if (i < min || i > max) continue
    seen.add(i)
  }
  return [...seen].sort((a, b) => a - b)
}

function normalizeCurrencyCode(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback
  const upper = value.trim().toUpperCase()
  return /^[A-Z]{3}$/.test(upper) ? upper : fallback
}

function normalizeBankAccount(raw: unknown, fallbackCurrency: string): StudioBankAccount | null {
  if (!raw || typeof raw !== 'object') return null
  const x = raw as Partial<StudioBankAccount>
  if (typeof x.id !== 'string' || x.id.length === 0) return null
  return {
    id: x.id,
    label: str(x.label, STUDIO_BANK_ACCOUNT_LIMITS.label),
    holderName: str(x.holderName, STUDIO_BANK_ACCOUNT_LIMITS.holderName),
    iban: normalizeIban(str(x.iban, STUDIO_BANK_ACCOUNT_LIMITS.iban)),
    bic: str(x.bic, STUDIO_BANK_ACCOUNT_LIMITS.bic).toUpperCase(),
    bankName: str(x.bankName, STUDIO_BANK_ACCOUNT_LIMITS.bankName),
    currency: normalizeCurrencyCode(x.currency, fallbackCurrency),
    isDefault: x.isDefault === true,
    note: str(x.note, STUDIO_BANK_ACCOUNT_LIMITS.note),
  }
}

/** Enforce: at most {@link STUDIO_BANK_ACCOUNTS_MAX} accounts and exactly one `isDefault` (if any exist). */
export function normalizeBankAccounts(raw: unknown, fallbackCurrency: string): StudioBankAccount[] {
  if (!Array.isArray(raw)) return defaultStudioBankAccounts()
  const items = raw
    .map((row) => normalizeBankAccount(row, fallbackCurrency))
    .filter((row): row is StudioBankAccount => row !== null)
    .slice(0, STUDIO_BANK_ACCOUNTS_MAX)
  if (items.length === 0) return items
  const firstDefault = items.findIndex((b) => b.isDefault)
  const defaultIdx = firstDefault >= 0 ? firstDefault : 0
  return items.map((b, i) => ({ ...b, isDefault: i === defaultIdx }))
}

export function normalizeTaxProfile(raw: unknown): StudioTaxProfile {
  const base = defaultStudioTaxProfile()
  if (!raw || typeof raw !== 'object') return base
  const x = raw as Partial<StudioTaxProfile>
  const mode = pickEnum<StudioTaxMode>(x.mode, STUDIO_TAX_MODES, base.mode)
  const defaultVatRatePercent = clampInt(
    x.defaultVatRatePercent,
    STUDIO_TAX_PROFILE_LIMITS.vatRateMin,
    STUDIO_TAX_PROFILE_LIMITS.vatRateMax,
    base.defaultVatRatePercent,
  )
  const vatRateOptions = uniqInts(
    x.vatRateOptions,
    STUDIO_TAX_PROFILE_LIMITS.vatRateMin,
    STUDIO_TAX_PROFILE_LIMITS.vatRateMax,
  )
  return {
    mode,
    defaultVatRatePercent,
    vatRateOptions: vatRateOptions.length > 0 ? vatRateOptions : base.vatRateOptions,
    steuernummer: str(x.steuernummer, STUDIO_TAX_PROFILE_LIMITS.steuernummer),
    ustIdNr: str(x.ustIdNr, STUDIO_TAX_PROFILE_LIMITS.ustIdNr).toUpperCase(),
    kleinunternehmerNote: str(
      x.kleinunternehmerNote,
      STUDIO_TAX_PROFILE_LIMITS.kleinunternehmerNote,
      base.kleinunternehmerNote,
    ),
    reverseChargeNote: str(x.reverseChargeNote, STUDIO_TAX_PROFILE_LIMITS.reverseChargeNote, base.reverseChargeNote),
    showTaxModeFooterNote: x.showTaxModeFooterNote !== false,
  }
}

function normalizeNumberingConfig(
  raw: unknown,
  fallback: StudioDocumentNumbering,
): StudioDocumentNumbering {
  if (!raw || typeof raw !== 'object') return fallback
  const x = raw as Partial<StudioDocumentNumbering>
  return {
    prefix: str(x.prefix, STUDIO_NUMBERING_LIMITS.prefix, fallback.prefix),
    separator: str(x.separator, STUDIO_NUMBERING_LIMITS.separator, fallback.separator),
    padWidth: clampInt(
      x.padWidth,
      STUDIO_NUMBERING_LIMITS.padWidthMin,
      STUDIO_NUMBERING_LIMITS.padWidthMax,
      fallback.padWidth,
    ),
    includeYear: x.includeYear !== false,
    yearResetPolicy: pickEnum<StudioYearResetPolicy>(
      x.yearResetPolicy,
      STUDIO_YEAR_RESET_POLICIES,
      fallback.yearResetPolicy,
    ),
    nextNumber: clampInt(
      x.nextNumber,
      STUDIO_NUMBERING_LIMITS.nextNumberMin,
      STUDIO_NUMBERING_LIMITS.nextNumberMax,
      fallback.nextNumber,
    ),
  }
}

export function normalizeInvoiceNumbering(raw: unknown): StudioDocumentNumbering {
  return normalizeNumberingConfig(raw, defaultInvoiceNumbering())
}

export function normalizeOfferNumbering(raw: unknown): StudioDocumentNumbering {
  return normalizeNumberingConfig(raw, defaultOfferNumbering())
}

export function normalizePaymentDefaults(raw: unknown): StudioPaymentDefaults {
  const base = defaultStudioPaymentDefaults()
  if (!raw || typeof raw !== 'object') return base
  const x = raw as Partial<StudioPaymentDefaults>
  return {
    netDays: clampInt(
      x.netDays,
      STUDIO_PAYMENT_DEFAULTS_LIMITS.netDaysMin,
      STUDIO_PAYMENT_DEFAULTS_LIMITS.netDaysMax,
      base.netDays,
    ),
    skontoPercent: clampNumber(
      x.skontoPercent,
      STUDIO_PAYMENT_DEFAULTS_LIMITS.skontoPercentMin,
      STUDIO_PAYMENT_DEFAULTS_LIMITS.skontoPercentMax,
      base.skontoPercent,
    ),
    skontoDays: clampInt(
      x.skontoDays,
      STUDIO_PAYMENT_DEFAULTS_LIMITS.skontoDaysMin,
      STUDIO_PAYMENT_DEFAULTS_LIMITS.skontoDaysMax,
      base.skontoDays,
    ),
    lateFeePercentPerMonth: clampNumber(
      x.lateFeePercentPerMonth,
      STUDIO_PAYMENT_DEFAULTS_LIMITS.lateFeePercentMin,
      STUDIO_PAYMENT_DEFAULTS_LIMITS.lateFeePercentMax,
      base.lateFeePercentPerMonth,
    ),
    lateFeeNote: str(x.lateFeeNote, STUDIO_PAYMENT_DEFAULTS_LIMITS.lateFeeNote, base.lateFeeNote),
    leistungszeitraumPolicy: pickEnum<StudioLeistungszeitraumPolicy>(
      x.leistungszeitraumPolicy,
      STUDIO_LEISTUNGSZEITRAUM_POLICIES,
      base.leistungszeitraumPolicy,
    ),
  }
}

function normalizeTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const result: string[] = []
  for (const v of raw) {
    if (typeof v !== 'string') continue
    const trimmed = v.trim().slice(0, STUDIO_DOCUMENT_SECTION_LIMITS.tag)
    if (trimmed.length === 0 || seen.has(trimmed)) continue
    seen.add(trimmed)
    result.push(trimmed)
    if (result.length >= STUDIO_DOCUMENT_SECTION_LIMITS.maxTags) break
  }
  return result
}

function normalizeDocumentSection(raw: unknown): StudioDocumentSection | null {
  if (!raw || typeof raw !== 'object') return null
  const x = raw as Partial<StudioDocumentSection>
  if (typeof x.id !== 'string' || x.id.length === 0) return null
  const kind = pickEnum<StudioDocumentSectionKind>(x.kind, STUDIO_DOCUMENT_SECTION_KINDS, 'terms')
  const locale = pickEnum<StudioDocumentSectionLocale>(x.locale, STUDIO_DOCUMENT_SECTION_LOCALES, 'any')
  return {
    id: x.id,
    kind,
    name: str(x.name, STUDIO_DOCUMENT_SECTION_LIMITS.name),
    body: str(x.body, STUDIO_DOCUMENT_SECTION_LIMITS.body),
    tags: normalizeTags(x.tags),
    locale,
  }
}

/** Replace unknown / malformed rows with defaults; cap to {@link STUDIO_DOCUMENT_SECTIONS_MAX}. */
export function normalizeDocumentSections(raw: unknown): StudioDocumentSection[] {
  if (!Array.isArray(raw)) return defaultStudioDocumentSections()
  const items = raw
    .map(normalizeDocumentSection)
    .filter((row): row is StudioDocumentSection => row !== null)
    .slice(0, STUDIO_DOCUMENT_SECTIONS_MAX)
  return items
}

function normalizeTemplateDefaults(raw: unknown): StudioDocumentTemplateDefaults {
  const fallback: StudioDocumentTemplateDefaults = {
    bankAccountId: null,
    taxModeOverride: null,
    validityDays: '',
    pricingPresetId: null,
  }
  if (!raw || typeof raw !== 'object') return fallback
  const x = raw as Partial<StudioDocumentTemplateDefaults>
  const validityRaw = typeof x.validityDays === 'string' ? x.validityDays.trim() : ''
  const validityDays = /^\d{1,4}$/.test(validityRaw) ? validityRaw : ''
  return {
    bankAccountId: typeof x.bankAccountId === 'string' && x.bankAccountId.length > 0 ? x.bankAccountId : null,
    taxModeOverride:
      typeof x.taxModeOverride === 'string' && (STUDIO_TAX_MODES as readonly string[]).includes(x.taxModeOverride)
        ? (x.taxModeOverride as StudioTaxMode)
        : null,
    validityDays,
    pricingPresetId:
      typeof x.pricingPresetId === 'string' && x.pricingPresetId.length > 0 ? x.pricingPresetId : null,
  }
}

function normalizeDocumentTemplate(raw: unknown): StudioDocumentTemplate | null {
  if (!raw || typeof raw !== 'object') return null
  const x = raw as Partial<StudioDocumentTemplate>
  if (typeof x.id !== 'string' || x.id.length === 0) return null
  const kind = pickEnum<StudioDocumentTemplateKind>(x.kind, STUDIO_DOCUMENT_TEMPLATE_KINDS, 'offer')
  const sectionIds = Array.isArray(x.sectionIds)
    ? x.sectionIds
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
        .slice(0, STUDIO_DOCUMENT_TEMPLATE_LIMITS.maxSectionsPerTemplate)
    : []
  return {
    id: x.id,
    kind,
    name: str(x.name, STUDIO_DOCUMENT_TEMPLATE_LIMITS.name),
    description: str(x.description, STUDIO_DOCUMENT_TEMPLATE_LIMITS.description),
    isDefault: x.isDefault === true,
    sectionIds,
    defaults: normalizeTemplateDefaults(x.defaults),
  }
}

/** Enforce exactly one default per `kind` (when at least one template of that kind exists). */
function ensureSingleTemplateDefaultPerKind(items: StudioDocumentTemplate[]): StudioDocumentTemplate[] {
  if (items.length === 0) return items
  const chosenDefaultId = new Map<StudioDocumentTemplateKind, string>()
  for (const tpl of items) {
    if (chosenDefaultId.has(tpl.kind)) continue
    if (tpl.isDefault) chosenDefaultId.set(tpl.kind, tpl.id)
  }
  for (const tpl of items) {
    if (chosenDefaultId.has(tpl.kind)) continue
    chosenDefaultId.set(tpl.kind, tpl.id)
  }
  return items.map((tpl) => ({ ...tpl, isDefault: chosenDefaultId.get(tpl.kind) === tpl.id }))
}

/** Drop section refs that no longer resolve; cap to {@link STUDIO_DOCUMENT_TEMPLATES_MAX}. */
export function normalizeDocumentTemplates(
  raw: unknown,
  knownSectionIds: ReadonlySet<string>,
): StudioDocumentTemplate[] {
  const initial = Array.isArray(raw)
    ? raw.map(normalizeDocumentTemplate).filter((t): t is StudioDocumentTemplate => t !== null)
    : defaultStudioDocumentTemplates()
  const pruned = initial
    .map((tpl) => ({ ...tpl, sectionIds: tpl.sectionIds.filter((id) => knownSectionIds.has(id)) }))
    .slice(0, STUDIO_DOCUMENT_TEMPLATES_MAX)
  return ensureSingleTemplateDefaultPerKind(pruned)
}
