import type { DeckLanguage } from '@/lib/proposals/deckLayout'
import {
  defaultDocumentKindLine,
  formatIssuedLine,
  formatRecipientAddressBlock,
  formatSenderBlock,
  formatValidLine,
} from '@/lib/proposals/documentMeta'
import { PROPOSAL_DEFAULT_VALIDITY_DAYS } from '@/lib/proposals/proposalDefaults'
import type { ProspectMergeContext } from '@/lib/proposals/mergeContext'
import type { ProposalBlock } from './blockSchema'

export type MergePackage = {
  accountName: string
  hqLine: string | null
  contactName: string | null
  contactRole: string | null
  contactEmail: string | null
  recipientAddressBlock: string | null
  senderBlock: string | null
  documentKindLine: string | null
  issuedLine: string | null
  validLine: string | null
  projectLabel: string | null
}

export type ContactRow = {
  fullName: string
  role: string | null
  email: string | null
}

/** First contact in stable order (by created_at). Caller passes sorted list. */
export function pickPrimaryContact(contacts: ContactRow[]): ContactRow | null {
  return contacts.length > 0 ? contacts[0] : null
}

export function buildHqLine(hqCity: string | null, hqCountry: string | null): string | null {
  const parts = [hqCity, hqCountry].filter(Boolean) as string[]
  if (parts.length === 0) return null
  return parts.join(', ')
}

/** Builds CRM merge strings for proposals (cover letterhead + doc meta). */
export function buildMergePackageFromContext(
  ctx: ProspectMergeContext,
  opts: {
    language: DeckLanguage
    proposalMeta?: {
      issuedAt: Date | null
      validityDays: number | null
      projectName: string | null
    }
  },
): MergePackage {
  const primary = pickPrimaryContact(ctx.contactsSorted)
  const lang = opts.language
  const issuedAt = opts.proposalMeta?.issuedAt ?? new Date()
  const validityDays =
    opts.proposalMeta?.validityDays != null && opts.proposalMeta.validityDays > 0
      ? opts.proposalMeta.validityDays
      : PROPOSAL_DEFAULT_VALIDITY_DAYS

  const recipientAddressBlock = formatRecipientAddressBlock({
    companyName: ctx.accountName,
    street: ctx.mailingStreet,
    postalCode: ctx.mailingPostalCode,
    locality: ctx.mailingLocality,
    countryCode: ctx.mailingCountryCode,
  })

  const senderBlock = ctx.organizationProfile
    ? formatSenderBlock(ctx.organizationProfile)
    : null

  const projectLabel =
    opts.proposalMeta?.projectName?.trim() ||
    ctx.projectPhaseLabel ||
    ctx.primaryTriggerLabel ||
    ctx.accountName

  return {
    accountName: ctx.accountName,
    hqLine: buildHqLine(ctx.hqCity, ctx.hqCountry),
    contactName: primary?.fullName ?? null,
    contactRole: primary?.role ?? null,
    contactEmail: primary?.email ?? null,
    recipientAddressBlock,
    senderBlock,
    documentKindLine: defaultDocumentKindLine(lang),
    issuedLine: formatIssuedLine(lang, issuedAt),
    validLine: formatValidLine(lang, validityDays),
    projectLabel,
  }
}

/** @deprecated Use buildMergePackageFromContext — kept for gradual migration of callers. */
export function buildMergePackage(args: {
  accountName: string
  hqCity: string | null
  hqCountry: string | null
  contactsSorted: ContactRow[]
}): MergePackage {
  return buildMergePackageFromContext(
    {
      accountId: '',
      accountName: args.accountName,
      hqCity: args.hqCity,
      hqCountry: args.hqCountry,
      mailingStreet: null,
      mailingPostalCode: null,
      mailingLocality: null,
      mailingCountryCode: null,
      contactsSorted: args.contactsSorted,
      organizationProfile: null,
      primaryTriggerLabel: null,
      projectPhaseLabel: null,
      studioGeneral: null,
    },
    { language: 'en', proposalMeta: { issuedAt: new Date(), validityDays: 3, projectName: null } },
  )
}

function pickMergeOrExisting(
  merged: string | null | undefined,
  existing: string,
): string {
  const m = merged?.trim() ?? ''
  const e = existing.trim()
  if (e !== '') return existing
  return m
}

/** Apply CRM merge fields to cover block; service_tags default fill happens in mergedDraft. */
export function applyMergeToBlocks(blocks: ProposalBlock[], m: MergePackage): ProposalBlock[] {
  return blocks.map((b) => {
    if (b.type !== 'cover') return b
    const dateLabel =
      b.props.dateLabel?.trim() !== ''
        ? b.props.dateLabel
        : (m.hqLine ?? b.props.dateLabel)

    return {
      ...b,
      props: {
        ...b.props,
        dateLabel,
        clientCompany: m.accountName || b.props.clientCompany,
        contactName: m.contactName ?? b.props.contactName,
        contactRole: m.contactRole ?? b.props.contactRole,
        contactEmail: m.contactEmail ?? b.props.contactEmail,
        documentKindLine: pickMergeOrExisting(m.documentKindLine, b.props.documentKindLine ?? ''),
        issuedLine: pickMergeOrExisting(m.issuedLine, b.props.issuedLine ?? ''),
        validLine: pickMergeOrExisting(m.validLine, b.props.validLine ?? ''),
        senderBlock: pickMergeOrExisting(m.senderBlock, b.props.senderBlock ?? ''),
        recipientBlock: pickMergeOrExisting(m.recipientAddressBlock, b.props.recipientBlock ?? ''),
      },
    }
  })
}

export type PublishValidationResult =
  | { ok: true }
  | { ok: false; code: 'cover_company' | 'cover_contact'; message: string }

/** Minimum bar before publishing externally (QLE-74). */
export function validatePublishReady(blocks: ProposalBlock[]): PublishValidationResult {
  const cover = blocks.find((b) => b.type === 'cover')
  if (!cover || cover.type !== 'cover') {
    return { ok: false, code: 'cover_company', message: 'missing_cover_block' }
  }
  const company = cover.props.clientCompany.trim()
  if (!company) {
    return {
      ok: false,
      code: 'cover_company',
      message: 'client_company_required',
    }
  }
  const hasContact =
    cover.props.contactName.trim().length > 0 || cover.props.contactEmail.trim().length > 0
  if (!hasContact) {
    return {
      ok: false,
      code: 'cover_contact',
      message: 'contact_name_or_email_required',
    }
  }
  return { ok: true }
}
