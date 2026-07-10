import { z } from 'zod'

export const ACCOUNT_OFFICE_KINDS = ['hq', 'branch', 'site', 'registered'] as const
export type AccountOfficeKind = (typeof ACCOUNT_OFFICE_KINDS)[number]

export const ACCOUNT_OFFICES_MAX = 12
export const ACCOUNT_OFFICE_PHONES_MAX = 4

const phoneSchema = z.object({
  id: z.string().uuid(),
  label: z.string().max(40),
  number: z.string().max(40),
})

const officeSchema = z.object({
  id: z.string().uuid(),
  label: z.string().max(120),
  kind: z.enum(ACCOUNT_OFFICE_KINDS),
  addressLine: z.string().max(200),
  addressLine2: z.string().max(200),
  postalCode: z.string().max(20),
  city: z.string().max(120),
  countryCode: z.string().max(2),
  phones: z.array(phoneSchema).max(ACCOUNT_OFFICE_PHONES_MAX),
  contactName: z.string().max(120),
  contactEmail: z.string().max(200),
  notes: z.string().max(2000),
  isPrimary: z.boolean(),
})

export const accountBillingSchema = z.object({
  legalName: z.string().max(200),
  vatId: z.string().max(40),
  taxNumber: z.string().max(40),
  addressLine: z.string().max(200),
  addressLine2: z.string().max(200),
  postalCode: z.string().max(20),
  locality: z.string().max(120),
  countryCode: z.string().max(2),
  contactName: z.string().max(120),
  contactEmail: z.string().max(200),
  contactPhone: z.string().max(40),
  paymentTermsDays: z.number().int().min(0).max(365).nullable(),
  poNumber: z.string().max(80),
  notes: z.string().max(2000),
})

export const accountCompanyProfileSchema = z.object({
  offices: z.array(officeSchema).max(ACCOUNT_OFFICES_MAX),
  billing: accountBillingSchema,
})

export type AccountOfficePhone = z.infer<typeof phoneSchema>
export type AccountOffice = z.infer<typeof officeSchema>
export type AccountBilling = z.infer<typeof accountBillingSchema>
export type AccountCompanyProfile = z.infer<typeof accountCompanyProfileSchema>

export function createEmptyBilling(): AccountBilling {
  return {
    legalName: '',
    vatId: '',
    taxNumber: '',
    addressLine: '',
    addressLine2: '',
    postalCode: '',
    locality: '',
    countryCode: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    paymentTermsDays: null,
    poNumber: '',
    notes: '',
  }
}

export function createEmptyOffice(kind: AccountOfficeKind = 'hq', isPrimary = false): AccountOffice {
  return {
    id: crypto.randomUUID(),
    label: '',
    kind,
    addressLine: '',
    addressLine2: '',
    postalCode: '',
    city: '',
    countryCode: '',
    phones: [],
    contactName: '',
    contactEmail: '',
    notes: '',
    isPrimary,
  }
}

export function createEmptyPhone(): AccountOfficePhone {
  return { id: crypto.randomUUID(), label: '', number: '' }
}

function normalizePhone(raw: unknown): AccountOfficePhone | null {
  if (!raw || typeof raw !== 'object') return null
  const x = raw as Record<string, unknown>
  const id = typeof x.id === 'string' ? x.id : crypto.randomUUID()
  return {
    id,
    label: typeof x.label === 'string' ? x.label : '',
    number: typeof x.number === 'string' ? x.number : '',
  }
}

function normalizeOffice(raw: unknown): AccountOffice | null {
  if (!raw || typeof raw !== 'object') return null
  const x = raw as Record<string, unknown>
  const id = typeof x.id === 'string' ? x.id : crypto.randomUUID()
  const kind =
    typeof x.kind === 'string' && (ACCOUNT_OFFICE_KINDS as readonly string[]).includes(x.kind)
      ? (x.kind as AccountOfficeKind)
      : 'hq'
  const phones = Array.isArray(x.phones)
    ? x.phones.map(normalizePhone).filter((p): p is AccountOfficePhone => p !== null).slice(0, ACCOUNT_OFFICE_PHONES_MAX)
    : []
  return {
    id,
    label: typeof x.label === 'string' ? x.label : '',
    kind,
    addressLine: typeof x.addressLine === 'string' ? x.addressLine : '',
    addressLine2: typeof x.addressLine2 === 'string' ? x.addressLine2 : '',
    postalCode: typeof x.postalCode === 'string' ? x.postalCode : '',
    city: typeof x.city === 'string' ? x.city : '',
    countryCode: typeof x.countryCode === 'string' ? x.countryCode.slice(0, 2).toUpperCase() : '',
    phones,
    contactName: typeof x.contactName === 'string' ? x.contactName : '',
    contactEmail: typeof x.contactEmail === 'string' ? x.contactEmail : '',
    notes: typeof x.notes === 'string' ? x.notes : '',
    isPrimary: x.isPrimary === true,
  }
}

export function normalizeOffices(raw: unknown): AccountOffice[] {
  if (!Array.isArray(raw)) return []
  const offices = raw.map(normalizeOffice).filter((o): o is AccountOffice => o !== null)
  if (offices.length === 0) return []
  const primaryIdx = offices.findIndex((o) => o.isPrimary)
  if (primaryIdx < 0) {
    offices[0] = { ...offices[0], isPrimary: true }
    return offices.slice(0, ACCOUNT_OFFICES_MAX)
  }
  return offices
    .map((o, i) => ({ ...o, isPrimary: i === primaryIdx }))
    .slice(0, ACCOUNT_OFFICES_MAX)
}

export function normalizeBilling(raw: unknown): AccountBilling {
  if (!raw || typeof raw !== 'object') return createEmptyBilling()
  const x = raw as Record<string, unknown>
  const paymentTermsDays =
    typeof x.paymentTermsDays === 'number' && Number.isInteger(x.paymentTermsDays)
      ? x.paymentTermsDays
      : null
  return {
    legalName: typeof x.legalName === 'string' ? x.legalName : '',
    vatId: typeof x.vatId === 'string' ? x.vatId : '',
    taxNumber: typeof x.taxNumber === 'string' ? x.taxNumber : '',
    addressLine: typeof x.addressLine === 'string' ? x.addressLine : '',
    addressLine2: typeof x.addressLine2 === 'string' ? x.addressLine2 : '',
    postalCode: typeof x.postalCode === 'string' ? x.postalCode : '',
    locality: typeof x.locality === 'string' ? x.locality : '',
    countryCode: typeof x.countryCode === 'string' ? x.countryCode.slice(0, 2).toUpperCase() : '',
    contactName: typeof x.contactName === 'string' ? x.contactName : '',
    contactEmail: typeof x.contactEmail === 'string' ? x.contactEmail : '',
    contactPhone: typeof x.contactPhone === 'string' ? x.contactPhone : '',
    paymentTermsDays,
    poNumber: typeof x.poNumber === 'string' ? x.poNumber : '',
    notes: typeof x.notes === 'string' ? x.notes : '',
  }
}

export function normalizeCompanyProfile(raw: {
  offices?: unknown
  billing?: unknown
}): AccountCompanyProfile {
  return {
    offices: normalizeOffices(raw.offices),
    billing: normalizeBilling(raw.billing),
  }
}

export function setPrimaryOffice(offices: AccountOffice[], primaryId: string): AccountOffice[] {
  return offices.map((o) => ({ ...o, isPrimary: o.id === primaryId }))
}

export function pickPrimaryOffice(offices: AccountOffice[]): AccountOffice | null {
  if (offices.length === 0) return null
  return offices.find((o) => o.isPrimary) ?? offices[0]
}

export function billingHasData(billing: AccountBilling): boolean {
  return Boolean(
    billing.legalName.trim() ||
      billing.vatId.trim() ||
      billing.taxNumber.trim() ||
      billing.addressLine.trim() ||
      billing.locality.trim(),
  )
}
