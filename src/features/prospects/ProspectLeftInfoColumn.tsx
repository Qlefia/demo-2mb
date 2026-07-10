'use client'

import { type Dispatch, type SetStateAction, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/react'
import { Building2, ExternalLink, MapPin, Settings2, Users } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useUserStore } from '@/stores/userStore'
import { canViewTeamMemberProfile } from '@/lib/team/access'
import Link from 'next/link'
import type { Prospect } from '@/features/prospects/types'
import type { DossierSections } from '@/lib/dossiers/schema'
import type { DossierRecordDTO } from '@/features/dossiers/types'
import { formatDateTime } from '@/lib/intl/datetime'
import { ProspectCompanyPanel } from '@/features/prospects/ProspectCompanyPanel'
import { ProspectStageSelect } from '@/features/prospects/ProspectStageSelect'
import { OwnerReassignCombobox } from '@/features/prospects/OwnerReassignCombobox'
import { ProspectPeoplePanel } from '@/features/prospects/ProspectPeoplePanel'
import { ProspectPlaybookSelect } from '@/features/prospects/ProspectPlaybookSelect'
import {
  ProspectAddressPanel,
  accountCompanyProfileQueryKey,
  fetchAccountCompanyProfile,
} from '@/features/accounts'
import { clampPriority, priorityLevelKey, territoryLabelKey } from '@/features/prospects/labels'
import { useProspectHeaderQuery } from '@/features/prospects/api/useProspectDetailQuery'
import { formatOpenDealSummary } from '@/features/prospects/lib/openDealSummary'
import { CrmStackedField, CrmStackedFieldList } from '@/components/molecules/CrmStackedField'
import {
  tabListStudioRelationsRailClass,
  tabTriggerStudioRelationsClass,
} from '@/components/molecules/Tabs/tabListStyles'
import { DOSSIER_EDITOR_ROLES, hasRole } from '@/lib/auth/roleGuards'

const ADDRESS_TAB_INDEX = 3

interface ProspectLeftInfoColumnProps {
  prospect: Prospect
  dossier: DossierRecordDTO | null
  sections: DossierSections
  setSections: Dispatch<SetStateAction<DossierSections>>
  onProspectUpdated: (next: Prospect) => void
  onDossierSaved?: (result: { dossier: DossierRecordDTO; sections: DossierSections }) => void
}

export function ProspectLeftInfoColumn({
  prospect,
  dossier,
  sections,
  setSections,
  onProspectUpdated,
  onDossierSaved,
}: ProspectLeftInfoColumnProps) {
  const { t, i18n } = useTranslation()
  const role = useUserStore((s) => s.role)
  const selfId = useUserStore((s) => s.user.id)
  const queryClient = useQueryClient()
  const [leftTabIndex, setLeftTabIndex] = useState(0)
  const headerQuery = useProspectHeaderQuery(prospect.id)
  const nextTouch = headerQuery.data?.nextTouch ?? null
  const openDeal = headerQuery.data?.openDeal ?? null
  const website = prospect.account.website?.trim() || null

  const canEdit = hasRole(role, DOSSIER_EDITOR_ROLES) && dossier?.status !== 'ready'

  const leftTabs = [
    { id: 'general', label: t('prospects.workspace.leftTabGeneral'), icon: Settings2 },
    { id: 'people', label: t('prospects.workspace.leftTabPeople'), icon: Users },
    { id: 'company', label: t('prospects.workspace.leftTabCompany'), icon: Building2 },
    { id: 'address', label: t('prospects.workspace.leftTabAddress'), icon: MapPin },
  ] as const

  useEffect(() => {
    void queryClient.prefetchQuery({
      queryKey: accountCompanyProfileQueryKey(prospect.accountId),
      queryFn: () => fetchAccountCompanyProfile(prospect.accountId),
    })
  }, [prospect.accountId, queryClient])

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:min-h-0">
      <TabGroup
        selectedIndex={leftTabIndex}
        onChange={setLeftTabIndex}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabList className={cn(tabListStudioRelationsRailClass, 'shrink-0 px-3 pt-3')}>
          {leftTabs.map(({ id, label, icon: Icon }) => (
            <Tab key={id} className={tabTriggerStudioRelationsClass} title={label} aria-label={label}>
              <Icon size={14} strokeWidth={1.25} aria-hidden />
            </Tab>
          ))}
        </TabList>
        <TabPanels
          className={cn(
            'min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 [scrollbar-gutter:stable]',
            'lg:max-h-full',
          )}
        >
          {/* General — record parameters, status, owner */}
          <TabPanel className="space-y-4 focus:outline-none">
            <CrmStackedFieldList aria-label={t('prospects.workspace.leftTabGeneral')}>
              <CrmStackedField label={t('prospects.workspace.pipelineStage')}>
                <ProspectStageSelect prospect={prospect} onProspectUpdated={onProspectUpdated} />
              </CrmStackedField>
              <CrmStackedField label={t('prospects.reassignOwner')}>
                <OwnerReassignCombobox
                  prospectId={prospect.id}
                  territory={prospect.territory}
                  currentOwnerId={prospect.ownerId}
                  hideLabel
                />
                {prospect.ownerId && selfId && canViewTeamMemberProfile(role, selfId, prospect.ownerId) ? (
                  <Link
                    href={`/team/${prospect.ownerId}`}
                    className="mt-2 inline-block text-xs font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {t('prospects.ownerTeamProfile')}
                  </Link>
                ) : null}
              </CrmStackedField>
              <CrmStackedField label={t('prospects.playbook.label')}>
                <ProspectPlaybookSelect prospect={prospect} onProspectUpdated={onProspectUpdated} />
              </CrmStackedField>
            </CrmStackedFieldList>

            <CrmStackedFieldList className="mt-4" aria-label={t('prospects.workspace.leftRecordAria')}>
              <CrmStackedField
                label={t('prospects.cols.territory')}
                value={t(territoryLabelKey(prospect.territory))}
              />
              <CrmStackedField
                label={t('prospects.cols.priority')}
                value={`${t(priorityLevelKey(prospect.priority))} (${clampPriority(prospect.priority)}/5)`}
              />
              <CrmStackedField
                label={t('dossier.status.label')}
                value={t(prospect.dossierStatus ? `dossier.status.${prospect.dossierStatus}` : 'dossier.status.none')}
              />
              <CrmStackedField
                label={t('prospects.workspace.nextTouch')}
                value={
                  nextTouch ? (
                    <span>
                      <span className="block font-medium text-foreground">{nextTouch.title}</span>
                      {nextTouch.at ? (
                        <span className="mt-0.5 block text-xs text-muted">
                          {formatDateTime(nextTouch.at, i18n.language)}
                        </span>
                      ) : null}
                    </span>
                  ) : (
                    <span className="text-muted">{t('prospects.workspace.nextTouchPlaceholder')}</span>
                  )
                }
              />
              {openDeal ? (
                <CrmStackedField
                  label={t('prospects.workspace.openDealField')}
                  value={formatOpenDealSummary(openDeal, i18n.language, t)}
                />
              ) : null}
              {website ? (
                <CrmStackedField
                  label={t('prospects.workspace.website')}
                  value={
                    <a
                      href={website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-w-0 items-center gap-1 text-primary hover:underline"
                    >
                      <span className="truncate">{website}</span>
                      <ExternalLink size={11} className="shrink-0" aria-hidden />
                    </a>
                  }
                />
              ) : null}
              <CrmStackedField
                label={t('prospects.cols.source')}
                value={t(`prospects.sources.${prospect.source}`, { defaultValue: prospect.source })}
              />
              <CrmStackedField
                label={t('prospects.cols.created')}
                value={formatDateTime(prospect.createdAt, i18n.language)}
              />
              {prospect.triageDecision ? (
                <CrmStackedField
                  label={t('prospects.cols.triageDecision')}
                  value={t(`prospects.triageDecisionBadge.${prospect.triageDecision}`)}
                />
              ) : null}
              {prospect.stage === 'lost' && prospect.lostReason ? (
                <CrmStackedField
                  label={t('opsToday.triage.lostReasonLabel')}
                  value={t(`prospects.lostReasons.${prospect.lostReason}`)}
                />
              ) : null}
            </CrmStackedFieldList>
          </TabPanel>

          {/* People — contacts CRUD */}
          <TabPanel className="space-y-3 focus:outline-none">
            <ProspectPeoplePanel prospect={prospect} onProspectUpdated={onProspectUpdated} />
          </TabPanel>

          {/* Company — summary by default, pencil to edit */}
          <TabPanel className="focus:outline-none">
            <ProspectCompanyPanel
              prospect={prospect}
              sections={sections}
              setSections={setSections}
              canEdit={canEdit}
              onDossierSaved={onDossierSaved}
            />
          </TabPanel>

          {/* Address — mount only when active to avoid layout work on hidden tab */}
          <TabPanel className="focus:outline-none">
            {leftTabIndex === ADDRESS_TAB_INDEX ? (
              <ProspectAddressPanel accountId={prospect.accountId} />
            ) : null}
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  )
}
