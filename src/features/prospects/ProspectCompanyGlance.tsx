'use client'

import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ExternalLink } from 'lucide-react'
import type { ContactDTO } from '@/features/contacts'
import type { Prospect } from '@/features/prospects/types'
import type { DossierSections } from '@/lib/dossiers/schema'
import { formatDateTime } from '@/lib/intl/datetime'
import { Chip } from '@/components/atoms'
import { CrmStackedField, CrmStackedFieldList } from '@/components/molecules/CrmStackedField'
import {
  formatContactLine,
  formatHqLine,
  isDisplayableContact,
  resolvePrimaryContact,
  resolveWebsite,
} from '@/features/prospects/lib/companySummary'

type ProspectCompanyGlanceProps = {
  prospect: Prospect
  sections: DossierSections
  contacts?: ContactDTO[]
  contactsLoading?: boolean
  /** Show company name as first row (sidebar). Overview uses the page header instead. */
  showName?: boolean
  className?: string
  /** Nested tinted box; false when already inside `studioTintPanel`. */
  tinted?: boolean
  /** Hide trigger row when shown in a dedicated trigger strip above. */
  hideTrigger?: boolean
}

function SegmentsValue({ segments }: { segments: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {segments.map((s) => (
        <Chip key={s} size="sm">
          {s}
        </Chip>
      ))}
    </div>
  )
}

function WebsiteValue({ href }: { href: string }) {
  const { t } = useTranslation()
  const display = href.replace(/^https?:\/\//i, '').replace(/\/$/, '')
  return (
    <a
      href={href.startsWith('http') ? href : `https://${href}`}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-primary hover:underline"
    >
      <span>{display}</span>
      <ExternalLink size={12} strokeWidth={1.5} aria-hidden />
      <span className="sr-only">{t('prospects.workspace.openWebsite')}</span>
    </a>
  )
}

type SummaryRow = {
  id: string
  label: string
  value: ReactNode
}

function pushRow(
  rows: SummaryRow[],
  id: string,
  label: string,
  value: ReactNode | undefined | null,
) {
  if (value === undefined || value === null || value === '') return
  rows.push({ id, label, value })
}

export function ProspectCompanyGlance({
  prospect,
  sections,
  contacts = [],
  contactsLoading = false,
  showName = true,
  className,
  tinted = true,
  hideTrigger = false,
}: ProspectCompanyGlanceProps) {
  const { t, i18n } = useTranslation()
  const snap = sections.snapshot ?? {}
  const wtd = sections.what_they_do ?? {}
  const hooks = sections.hooks?.items ?? []
  const techNotes = sections.tech_clues?.notes?.trim()
  const competitiveNotes = sections.competitive?.notes?.trim()
  const website = resolveWebsite(prospect, sections)
  const hq = formatHqLine(snap.hqCity, snap.hqCountry)
  const projectPhase = snap.projectPhase?.trim()
  const triggerText = prospect.latestTrigger?.text?.trim()
  const primary =
    contactsLoading
      ? undefined
      : resolvePrimaryContact(
          contacts,
          sections.decision_makers?.contactIds,
          prospect.primaryContactId,
        )
  const displayContact = isDisplayableContact(primary) ? primary : undefined

  const rows: SummaryRow[] = []

  if (showName) pushRow(rows, 'name', t('prospects.company.name'), prospect.account.name)
  if (website) pushRow(rows, 'website', t('prospects.workspace.website'), <WebsiteValue href={website} />)
  if (hq) pushRow(rows, 'hq', t('prospects.company.city'), hq)
  if (projectPhase) pushRow(rows, 'projectPhase', t('prospects.company.projectPhase'), projectPhase)
  if (triggerText && !hideTrigger) {
    pushRow(
      rows,
      'trigger',
      t('prospects.latestTrigger'),
      prospect.latestTrigger
        ? `${triggerText} · ${formatDateTime(prospect.latestTrigger.capturedAt, i18n.language)}`
        : triggerText,
    )
  }
  if (wtd.summary) pushRow(rows, 'summary', t('prospects.workspace.summaryLabel'), wtd.summary)
  if (wtd.segments?.length) {
    pushRow(rows, 'segments', t('prospects.company.segments'), <SegmentsValue segments={wtd.segments} />)
  }
  if (snap.architectAgency) {
    pushRow(rows, 'architect', t('prospects.company.architectAgency'), snap.architectAgency)
  }
  if (wtd.flagshipOffering) {
    pushRow(
      rows,
      'flagship',
      t('dossier.sections.what_they_do.fields.flagshipOffering'),
      wtd.flagshipOffering,
    )
  }
  if (wtd.targetCustomer) {
    pushRow(rows, 'target', t('prospects.company.targetCustomer'), wtd.targetCustomer)
  }
  if (snap.notes) pushRow(rows, 'observation', t('prospects.company.visualObservation'), snap.notes)
  if (techNotes) pushRow(rows, 'tech', t('prospects.company.techNotes'), techNotes)
  if (competitiveNotes) {
    pushRow(rows, 'competitive', t('prospects.company.competitiveNotes'), competitiveNotes)
  }
  if (hooks[0]) pushRow(rows, 'hook', t('prospects.workspace.hookLead'), hooks[0])
  if (displayContact) {
    pushRow(
      rows,
      'contact',
      t('prospects.workspace.primaryContact'),
      <>
        <p>{formatContactLine(displayContact)}</p>
        {displayContact.email ? <p className="mt-0.5 text-xs text-muted">{displayContact.email}</p> : null}
      </>,
    )
  }

  if (rows.length === 0) {
    return <p className="text-sm text-muted">{t('prospects.company.empty')}</p>
  }

  return (
    <CrmStackedFieldList
      tinted={tinted}
      className={className}
      aria-label={t('prospects.company.summaryAria')}
    >
      {rows.map((row) => (
        <CrmStackedField key={row.id} label={row.label} value={row.value} />
      ))}
    </CrmStackedFieldList>
  )
}
