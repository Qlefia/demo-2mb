'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Container, Button, PageLoadingCenter } from '@/components/atoms'
import { TabBar } from '@/components/molecules/Tabs'
import { studioTintPanel } from '@/features/studio-settings/studioBlockChrome'
import { useUpsertProspectCache } from '@/features/prospects/api'
import {
  useProspectDossierQuery,
  useProspectEnrichmentJobsQuery,
  useProspectHeaderQuery,
  useProspectQuery,
} from '@/features/prospects/api/useProspectDetailQuery'
import {
  prospectDetailQueryKey,
  prospectDossierQueryKey,
  prospectEnrichmentJobsQueryKey,
} from '@/features/prospects/api/prospectDetailQueryKeys'
import type { Prospect } from '@/features/prospects'
import { DossierEditor, QualityChecklist } from '@/features/dossiers'
import type { DossierRecordDTO } from '@/features/dossiers/types'
import type { DossierSections } from '@/lib/dossiers/schema'
import { EMPTY_SECTIONS } from '@/lib/dossiers/schema'
import { validateDossier } from '@/lib/dossiers/validate'
import { ActivityPanel } from '@/features/activities'
import type { UserActivityType } from '@/features/activities/types'
import { toast } from '@/components/molecules/Toast'
import { useUserStore } from '@/stores/userStore'
import { useProspectContacts } from '@/features/contacts'
import { ProspectLeftInfoColumn } from '@/features/prospects/ProspectLeftInfoColumn'
import { ProspectRightActionPanel } from '@/features/prospects/ProspectRightActionPanel'
import { MeetingsPanel } from '@/features/meetings/MeetingsPanel'
import { MeetingCreateModal } from '@/features/meetings/MeetingCreateModal'
import { ProspectOverviewPanel } from '@/features/prospects/ProspectOverviewPanel'
import { ProspectRelationshipsPanel } from '@/features/prospects/ProspectRelationshipsPanel'
import { ProspectProposalsPanel, ProspectOffersPanel } from '@/features/prospects/ProspectDocumentsPanel'
import { ProjectsPanel } from '@/features/client-projects/ProjectsPanel'
import { ProspectContextHeader } from '@/features/prospects/ProspectContextHeader'
import { ProspectMobileRailBar } from '@/features/prospects/ProspectMobileRailBar'
import { ProspectSideRailShell } from '@/features/prospects/ProspectSideRailShell'
import { getDefaultWorkspaceTab, getNextBestAction } from '@/features/prospects/nextBestAction'
import { resolvePrimaryContact } from '@/features/prospects/lib/companySummary'
import { DOSSIER_EDITOR_ROLES, OPS_PRIVILEGED_ROLES, hasRole } from '@/lib/auth/roleGuards'

type WorkspaceTabKey = 'overview' | 'dossier' | 'activity' | 'meetings' | 'relationships' | 'projects' | 'proposals' | 'offers'

const WORKSPACE_TAB_DEFS = [
  ['overview', 'prospects.workspace.tabOverview'],
  ['dossier', 'dossier.tabs.dossier'],
  ['activity', 'dossier.tabs.activity'],
  ['meetings', 'prospects.workspace.tabMeetings'],
  ['relationships', 'prospects.workspace.tabRelationships'],
  ['projects', 'prospects.workspace.tabProjects'],
  ['proposals', 'prospects.workspace.tabProposals'],
  ['offers', 'prospects.workspace.tabOffers'],
] as const satisfies readonly [WorkspaceTabKey, string][]

export function ProspectDetailPage() {
  const { t } = useTranslation()
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const id = typeof params.id === 'string' ? params.id : null

  const upsertProspect = useUpsertProspectCache()
  const prospectQuery = useProspectQuery(id)
  const headerQuery = useProspectHeaderQuery(id)
  const dossierQuery = useProspectDossierQuery(id)
  const enrichmentQuery = useProspectEnrichmentJobsQuery(id)
  const { contacts } = useProspectContacts(id ?? '')

  const [dossier, setDossier] = useState<DossierRecordDTO | null>(null)
  const [sections, setSections] = useState<DossierSections>(EMPTY_SECTIONS)
  const [dossierBaseline, setDossierBaseline] = useState(0)
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTabKey>('overview')
  const [meetingModalOpen, setMeetingModalOpen] = useState(false)
  const [leftRailOpen, setLeftRailOpen] = useState(false)
  const [rightRailOpen, setRightRailOpen] = useState(false)
  const [leftRailFullscreen, setLeftRailFullscreen] = useState(false)
  const [rightRailFullscreen, setRightRailFullscreen] = useState(false)
  const role = useUserStore((s) => s.role)
  const [enrichBusy, setEnrichBusy] = useState(false)
  const [composerSeed, setComposerSeed] = useState<{ type: UserActivityType; nonce: number } | null>(null)
  const defaultedIdRef = useRef<string | null>(null)

  const loading = prospectQuery.isLoading
  const prospect = prospectQuery.data ?? null
  const enrichmentJobs = enrichmentQuery.data ?? []

  useEffect(() => {
    if (!dossierQuery.data) return
    setDossier(dossierQuery.data.dossier)
    setSections(dossierQuery.data.sections)
    setDossierBaseline((b) => b + 1)
  }, [dossierQuery.dataUpdatedAt, dossierQuery.data])

  useEffect(() => {
    if (prospectQuery.data) {
      upsertProspect(prospectQuery.data)
    }
  }, [prospectQuery.data, upsertProspect])

  const handleProspectUpdated = useCallback(
    (next: Prospect) => {
      queryClient.setQueryData(prospectDetailQueryKey(next.id), next)
      upsertProspect(next)
    },
    [queryClient, upsertProspect],
  )

  // Stage- and role-aware default tab, applied once per prospect id.
  useEffect(() => {
    if (!id || !prospect) return
    if (defaultedIdRef.current === id) return
    defaultedIdRef.current = id
    setWorkspaceTab(getDefaultWorkspaceTab({ stage: prospect.stage, role }))
  }, [id, prospect, role])

  const hasContactMethod = useMemo(() => {
    const ids = sections.decision_makers?.contactIds ?? []
    if (ids.length === 0) return false
    const map = new Map(contacts.map((c) => [c.id, c]))
    return ids.some((cid) => {
      const c = map.get(cid)
      return Boolean(c && (c.email || c.linkedinUrl))
    })
  }, [contacts, sections.decision_makers?.contactIds])

  const checklistResult = useMemo(
    () => validateDossier(sections, { hasContactMethod, mode: 'manual' }),
    [hasContactMethod, sections],
  )
  const checklistPassed = useMemo(
    () => checklistResult.checks.filter((c) => c.status === 'passed').length,
    [checklistResult],
  )
  const checklistTotal = checklistResult.checks.length

  const primaryContact = useMemo(
    () =>
      resolvePrimaryContact(
        contacts,
        sections.decision_makers?.contactIds,
        prospect?.primaryContactId,
      ),
    [contacts, prospect?.primaryContactId, sections.decision_makers?.contactIds],
  )

  const workspaceTabItems = useMemo(
    () => WORKSPACE_TAB_DEFS.map(([key, labelKey]) => ({ id: key, label: t(labelKey) })),
    [t],
  )

  if (loading) {
    return <PageLoadingCenter framed />
  }

  if (!prospect) {
    return (
      <Container className="py-8">
        <p className="text-muted">{t('error.somethingWentWrong')}</p>
        <p className="mt-2 text-sm text-muted">{t('error.pageNotFound')}</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.push('/prospects')}>
          <ArrowLeft size={16} />
          {t('common.back')}
        </Button>
      </Container>
    )
  }

  const canManualEnrich =
    hasRole(role, OPS_PRIVILEGED_ROLES) &&
    (prospect.stage === 'triaged' || prospect.stage === 'enriching')

  const prospectId = prospect.id
  const isEditor = hasRole(role, DOSSIER_EDITOR_ROLES)
  const dossierLoading = dossierQuery.isLoading
  const nextBestAction = getNextBestAction({
    stage: prospect.stage,
    role,
    dossierStatus: prospect.dossierStatus,
    canManualEnrich,
  })

  function openActivityWithCall() {
    setWorkspaceTab('activity')
    setComposerSeed((prev) => ({ type: 'call', nonce: (prev?.nonce ?? 0) + 1 }))
  }

  function handlePrimaryAction() {
    switch (nextBestAction.kind) {
      case 'enrich':
        void runEnrichment()
        break
      case 'dossier':
        setWorkspaceTab('dossier')
        break
      case 'logCall':
        openActivityWithCall()
        break
      case 'proposal':
        router.push(`/prospects/${prospectId}/proposal`)
        break
      case 'activity':
        setWorkspaceTab('activity')
        break
    }
  }

  async function runEnrichment() {
    setEnrichBusy(true)
    try {
      const res = await fetch(`/api/prospects/${prospectId}/enrich`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) {
        toast(t('error.somethingWentWrong'), 'error')
        return
      }
      toast(t('prospects.enrich.success'))
      void queryClient.invalidateQueries({ queryKey: prospectDossierQueryKey(prospectId) })
      void queryClient.invalidateQueries({ queryKey: prospectEnrichmentJobsQueryKey(prospectId) })
    } finally {
      setEnrichBusy(false)
    }
  }

  return (
    <Container className="flex min-h-0 flex-1 flex-col max-lg:pb-[var(--page-bottom-inset)] lg:max-w-none lg:px-0 lg:py-0">
      <div
        className={cn(
          'flex min-h-0 flex-col gap-6 max-lg:gap-4',
          'lg:grid lg:h-full lg:max-h-full lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)_minmax(0,320px)] lg:gap-0 lg:overflow-hidden',
        )}
      >
        <ProspectSideRailShell
          side="left"
          panelId="prospect-left-rail-panel"
          ariaLabel={t('prospects.workspace.mobileRail.companyPanel')}
          open={leftRailOpen}
          onOpenChange={setLeftRailOpen}
          fullscreen={leftRailFullscreen}
          onFullscreenChange={setLeftRailFullscreen}
          className="order-2 lg:order-none"
        >
          <ProspectLeftInfoColumn
            prospect={prospect}
            dossier={dossier}
            sections={sections}
            setSections={setSections}
            onProspectUpdated={handleProspectUpdated}
            onDossierSaved={({ dossier: nextDossier, sections: nextSections }) => {
              setDossier(nextDossier)
              setSections(nextSections)
              setDossierBaseline((b) => b + 1)
            }}
          />
        </ProspectSideRailShell>

        <main className="order-1 flex min-w-0 flex-col max-lg:flex-none lg:order-none lg:min-h-0 lg:overflow-hidden">
          <div className="flex min-h-0 flex-col max-lg:flex-none lg:flex-1 lg:overflow-hidden lg:px-4 lg:pt-2">
            <div className="sticky top-0 z-20 shrink-0 bg-background pt-[var(--page-padding)] lg:static lg:z-auto lg:bg-transparent lg:pt-0">
              <ProspectContextHeader
                prospect={prospect}
                nextBestAction={nextBestAction}
                nextBestActionBusy={nextBestAction.kind === 'enrich' && enrichBusy}
                onPrimaryAction={handlePrimaryAction}
                proposalHref={`/prospects/${prospect.id}/proposal`}
                onLogCall={openActivityWithCall}
              />
              <TabBar
                items={workspaceTabItems}
                selectedId={workspaceTab}
                onChange={(id) => setWorkspaceTab(id as WorkspaceTabKey)}
                ariaLabel={t('prospects.workspace.mainAria')}
                variant="underline"
                panelIdPrefix="prospect-workspace"
                triggerIdSuffix={prospect.id}
                className="mt-2"
              />

              <ProspectMobileRailBar
                companyLabel={t('prospects.workspace.mobileRail.companyPanel')}
                toolsLabel={t('prospects.workspace.mobileRail.toolsPanel')}
                onOpenCompany={() => {
                  setRightRailOpen(false)
                  setRightRailFullscreen(false)
                  setLeftRailOpen(true)
                }}
                onOpenTools={() => {
                  setLeftRailOpen(false)
                  setLeftRailFullscreen(false)
                  setRightRailOpen(true)
                }}
              />
            </div>

            <div className="min-h-0 max-lg:flex-none pt-3 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain [scrollbar-gutter:stable]">
              {workspaceTab === 'overview' ? (
                <section id="prospect-workspace-overview" role="tabpanel">
                  <ProspectOverviewPanel
                    prospect={prospect}
                    sections={sections}
                    openDeal={headerQuery.data?.openDeal ?? null}
                    canAddTrigger={hasRole(role, OPS_PRIVILEGED_ROLES)}
                    onTriggerAdded={() => {
                      void queryClient.invalidateQueries({ queryKey: prospectDetailQueryKey(prospect.id) })
                    }}
                    onOpenMeetingsTab={() => setWorkspaceTab('meetings')}
                    onScheduleMeeting={() => setMeetingModalOpen(true)}
                  />
                </section>
              ) : null}

              {workspaceTab === 'meetings' ? (
                <section id="prospect-workspace-meetings" role="tabpanel">
                  <MeetingsPanel prospect={prospect} />
                </section>
              ) : null}

              {workspaceTab === 'dossier' ? (
                <section id="prospect-workspace-dossier" role="tabpanel" className="min-w-0 space-y-3">
                {isEditor ? (
                  <details className={cn('group', studioTintPanel)}>
                    <summary className="flex cursor-pointer list-none select-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
                      <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <ChevronRight
                          size={14}
                          className="text-muted transition-transform group-open:rotate-90"
                          aria-hidden
                        />
                        {t('prospects.workspace.tabChecklist')}
                      </span>
                      <span
                        className={cn(
                          'text-xs',
                          checklistPassed === checklistTotal ? 'text-emerald-600' : 'text-muted',
                        )}
                      >
                        {checklistPassed}/{checklistTotal}
                      </span>
                    </summary>
                    <div className="mt-3 space-y-3">
                      <QualityChecklist result={checklistResult} hideHeader />
                      <p className="text-xs text-muted">{t('prospects.workspace.checklistHint')}</p>
                    </div>
                  </details>
                ) : null}

                {dossierLoading ? (
                  <p className="text-sm text-muted">{t('common.loading')}</p>
                ) : (
                  <DossierEditor
                    prospectId={prospect.id}
                    initialDossier={dossier}
                    sections={sections}
                    onSectionsChange={setSections}
                    dossierBaseline={dossierBaseline}
                    omitSectionIds={[1, 2]}
                    onDossierChanged={(nextDossier, nextSections) => {
                      setDossier(nextDossier)
                      if (nextSections) {
                        setSections(nextSections)
                        setDossierBaseline((b) => b + 1)
                      }
                      if (prospect && nextDossier) {
                        upsertProspect({
                          ...prospect,
                          dossierStatus: nextDossier.status,
                        })
                      }
                    }}
                  />
                )}
                </section>
              ) : null}

              {workspaceTab === 'activity' ? (
                <section id="prospect-workspace-activity" role="tabpanel" className="min-w-0">
                  <ActivityPanel
                    prospectId={prospect.id}
                    composerSeedType={composerSeed?.type}
                    composerSeedNonce={composerSeed?.nonce}
                  />
                </section>
              ) : null}

              {workspaceTab === 'relationships' ? (
                <section id="prospect-workspace-relationships" role="tabpanel">
                  <ProspectRelationshipsPanel
                    prospectId={prospect.id}
                    onOpenDossierTab={() => setWorkspaceTab('dossier')}
                  />
                </section>
              ) : null}

              {workspaceTab === 'projects' ? (
                <section id="prospect-workspace-projects" role="tabpanel">
                  <ProjectsPanel prospectId={prospect.id} />
                </section>
              ) : null}

              {workspaceTab === 'proposals' ? (
                <section id="prospect-workspace-proposals" role="tabpanel">
                  <ProspectProposalsPanel prospectId={prospect.id} />
                </section>
              ) : null}

              {workspaceTab === 'offers' ? (
                <section id="prospect-workspace-offers" role="tabpanel">
                  <ProspectOffersPanel prospectId={prospect.id} />
                </section>
              ) : null}

              {role && enrichmentJobs.length > 0 ? (
                <div className="mt-6 border-t border-border pt-3 text-xs text-muted lg:mt-8">
                  <span className="font-medium text-foreground">{t('enrichmentJobs.title')}: </span>
                  {enrichmentJobs.slice(0, 4).map((j) => (
                    <span key={j.id} className="mr-3">
                      {j.provider} ({j.status})
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </main>

        <ProspectSideRailShell
          side="right"
          panelId="prospect-right-rail-panel"
          ariaLabel={t('prospects.workspace.mobileRail.toolsPanel')}
          open={rightRailOpen}
          onOpenChange={setRightRailOpen}
          fullscreen={rightRailFullscreen}
          onFullscreenChange={setRightRailFullscreen}
          className="order-3 lg:order-none"
        >
          <ProspectRightActionPanel
            prospectId={prospect.id}
            territory={prospect.territory}
            primaryContactEmail={primaryContact?.email ?? null}
            primaryContactPhone={primaryContact?.phone ?? null}
            accountName={prospect.account?.name ?? null}
            suggestedPlaybookId={prospect.suggestedPlaybookId}
          />
        </ProspectSideRailShell>
      </div>

      <MeetingCreateModal
        open={meetingModalOpen}
        onClose={() => setMeetingModalOpen(false)}
        prospectId={prospect.id}
      />
    </Container>
  )
}
