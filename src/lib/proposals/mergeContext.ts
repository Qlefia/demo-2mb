import { asc, desc, eq } from 'drizzle-orm'
import {
  billingHasData,
  normalizeBilling,
  normalizeOffices,
  pickPrimaryOffice,
} from '@/lib/accounts/companyProfile'
import {
  accounts,
  contacts,
  dossiers,
  organizationProfile,
  prospects,
  triggers,
  workspaceStudioSettings,
} from '@/lib/db/schema'
import type { Database } from '@/lib/db/client'
import { organizationProfileFromStudioGeneral } from '@/lib/proposals/studioSenderProfile'
import type { ContactRow } from './mergeFields'

export type ProspectMergeContext = {
  accountId: string
  accountName: string
  hqCity: string | null
  hqCountry: string | null
  mailingStreet: string | null
  mailingPostalCode: string | null
  mailingLocality: string | null
  mailingCountryCode: string | null
  contactsSorted: ContactRow[]
  organizationProfile: {
    legalName: string
    addressLine: string
    registerLine: string | null
  } | null
  /** Human-readable trigger text (not the machine type code). */
  primaryTriggerLabel: string | null
  /** Dossier snapshot project phase when captured. */
  projectPhaseLabel: string | null
  /** Raw `workspace_studio_settings.general` jsonb for brand + boilerplate merge. */
  studioGeneral: unknown | null
}

function triggerTextFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  const text = (payload as { text?: unknown }).text
  return typeof text === 'string' && text.trim() ? text.trim() : null
}

function projectPhaseFromSections(sections: unknown): string | null {
  if (!sections || typeof sections !== 'object') return null
  const snap = (sections as { snapshot?: { projectPhase?: unknown } }).snapshot
  const phase = snap?.projectPhase
  return typeof phase === 'string' && phase.trim() ? phase.trim() : null
}

export async function fetchProspectMergeContext(
  tx: Database,
  prospectId: string,
): Promise<ProspectMergeContext | null> {
  const [row] = await tx
    .select({
      accountId: accounts.id,
      accountName: accounts.name,
      workspaceId: accounts.workspaceId,
      hqCity: accounts.hqCity,
      hqCountry: accounts.hqCountry,
      mailingStreet: accounts.mailingStreet,
      mailingPostalCode: accounts.mailingPostalCode,
      mailingLocality: accounts.mailingLocality,
      mailingCountryCode: accounts.mailingCountryCode,
      offices: accounts.offices,
      billing: accounts.billing,
      orgLegalName: organizationProfile.legalName,
      orgAddressLine: organizationProfile.addressLine,
      orgRegisterLine: organizationProfile.registerLine,
      studioGeneral: workspaceStudioSettings.general,
      dossierSections: dossiers.sections,
    })
    .from(prospects)
    .innerJoin(accounts, eq(prospects.accountId, accounts.id))
    .leftJoin(organizationProfile, eq(accounts.workspaceId, organizationProfile.workspaceId))
    .leftJoin(workspaceStudioSettings, eq(accounts.workspaceId, workspaceStudioSettings.workspaceId))
    .leftJoin(dossiers, eq(dossiers.prospectId, prospects.id))
    .where(eq(prospects.id, prospectId))
    .limit(1)

  if (!row) return null

  const contactRows = await tx
    .select({
      fullName: contacts.fullName,
      role: contacts.role,
      email: contacts.email,
    })
    .from(contacts)
    .where(eq(contacts.accountId, row.accountId))
    .orderBy(asc(contacts.createdAt))

  const contactsSorted: ContactRow[] = contactRows.map((c) => ({
    fullName: c.fullName,
    role: c.role,
    email: c.email,
  }))

  const orgFromTable =
    row.orgLegalName && row.orgAddressLine
      ? {
          legalName: row.orgLegalName,
          addressLine: row.orgAddressLine,
          registerLine: row.orgRegisterLine,
        }
      : null

  const orgFromStudio = organizationProfileFromStudioGeneral(row.studioGeneral)
  const organizationProfileResolved = orgFromStudio ?? orgFromTable

  const [tri] = await tx
    .select({ type: triggers.type, payload: triggers.payload })
    .from(triggers)
    .where(eq(triggers.prospectId, prospectId))
    .orderBy(desc(triggers.occurredAt))
    .limit(1)

  const triggerText = triggerTextFromPayload(tri?.payload)
  const primaryTriggerLabel = triggerText ?? tri?.type ?? null
  const projectPhaseLabel = projectPhaseFromSections(row.dossierSections)

  const billing = normalizeBilling(row.billing)
  const primaryOffice = pickPrimaryOffice(normalizeOffices(row.offices))

  const accountName =
    billingHasData(billing) && billing.legalName.trim()
      ? billing.legalName.trim()
      : row.accountName

  const mailingStreet = billingHasData(billing)
    ? billing.addressLine || row.mailingStreet
    : primaryOffice?.addressLine || row.mailingStreet

  const mailingPostalCode = billingHasData(billing)
    ? billing.postalCode || row.mailingPostalCode
    : primaryOffice?.postalCode || row.mailingPostalCode

  const mailingLocality = billingHasData(billing)
    ? billing.locality || row.mailingLocality
    : primaryOffice?.city || row.mailingLocality

  const mailingCountryCode = billingHasData(billing)
    ? billing.countryCode || row.mailingCountryCode
    : primaryOffice?.countryCode || row.mailingCountryCode

  const hqCity = primaryOffice?.city || row.hqCity
  const hqCountry = primaryOffice?.countryCode || row.hqCountry

  return {
    accountId: row.accountId,
    accountName,
    hqCity,
    hqCountry,
    mailingStreet,
    mailingPostalCode,
    mailingLocality,
    mailingCountryCode,
    contactsSorted,
    organizationProfile: organizationProfileResolved,
    primaryTriggerLabel,
    projectPhaseLabel,
    studioGeneral: row.studioGeneral,
  }
}
