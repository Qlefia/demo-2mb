'use client'

import { useTranslation } from 'react-i18next'
import type { DossierSections } from '@/lib/dossiers/schema'
import type { Prospect } from '@/features/prospects/types'
import { useProspectContacts } from '@/features/contacts'
import { EnrichmentJobsBanner } from '@/features/dossiers/EnrichmentJobsBanner'
import { MeetingsOverviewWidget } from '@/features/meetings/MeetingsOverviewWidget'
import { ProspectCompanyGlance } from '@/features/prospects/ProspectCompanyGlance'
import { ProspectTriggerStrip } from '@/features/prospects/ProspectTriggerStrip'
import { CrmStackedField, CrmStackedFieldList } from '@/components/molecules/CrmStackedField'
import { studioTintPanel } from '@/features/studio-settings/studioBlockChrome'

import type { ProspectOpenDeal } from '@/lib/prospects/headerData'

interface ProspectOverviewPanelProps {
  prospect: Prospect
  sections: DossierSections
  openDeal?: ProspectOpenDeal | null
  canAddTrigger?: boolean
  onTriggerAdded?: () => void
  onOpenMeetingsTab: () => void
  onScheduleMeeting: () => void
}

export function ProspectOverviewPanel({
  prospect,
  sections,
  openDeal,
  canAddTrigger,
  onTriggerAdded,
  onOpenMeetingsTab,
  onScheduleMeeting,
}: ProspectOverviewPanelProps) {
  const { t } = useTranslation()
  const { contacts, loading: contactsLoading } = useProspectContacts(prospect.id)
  const cases = sections.cases?.items ?? []
  const signals = sections.signals?.items ?? []

  return (
    <div className="space-y-6">
      <ProspectTriggerStrip
        prospect={prospect}
        openDeal={openDeal}
        canAddTrigger={canAddTrigger}
        onTriggerAdded={onTriggerAdded}
      />

      <MeetingsOverviewWidget
        prospectId={prospect.id}
        onViewAll={onOpenMeetingsTab}
        onSchedule={onScheduleMeeting}
      />

      <section className={studioTintPanel}>
        <h2 className="crm-meta-label">{t('prospects.company.overviewTitle')}</h2>
        <div className="mt-3">
          <ProspectCompanyGlance
            prospect={prospect}
            sections={sections}
            contacts={contacts}
            contactsLoading={contactsLoading}
            showName
            hideTrigger
            tinted={false}
          />
        </div>
      </section>

      {cases.some((c) => c.name) ? (
        <section className={studioTintPanel}>
          <h2 className="crm-meta-label">{t('prospects.workspace.fitTitle')}</h2>
          <CrmStackedFieldList tinted={false} className="mt-3 px-0">
            <CrmStackedField
              label={t('prospects.workspace.caseMatches')}
              value={
                <ul className="space-y-1.5">
                  {cases
                    .filter((c) => c.name)
                    .slice(0, 3)
                    .map((c, i) => (
                      <li key={`${c.name}-${i}`}>
                        <span className="font-medium">{c.name}</span>
                        {c.why ? <span className="text-muted"> — {c.why}</span> : null}
                      </li>
                    ))}
                </ul>
              }
            />
          </CrmStackedFieldList>
        </section>
      ) : null}

      <EnrichmentJobsBanner prospectId={prospect.id} />

      {signals.length > 0 ? (
        <section className={studioTintPanel}>
          <h2 className="text-sm font-semibold">{t('prospects.workspace.signalsTitle')}</h2>
          <ul className="mt-3 space-y-2 text-xs">
            {signals.slice(0, 5).map((s, i) => (
              <li key={`${s.text}-${i}`} className="border-t border-border pt-2 first:border-t-0 first:pt-0">
                <p>{s.text}</p>
                {s.sourceUrl ? (
                  <a
                    href={s.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-primary hover:underline"
                  >
                    {t('prospects.workspace.signalSource')}
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

    </div>
  )
}
