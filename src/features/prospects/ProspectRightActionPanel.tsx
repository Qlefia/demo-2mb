'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/react'
import {
  Coins,
  ClipboardCheck,
  MessageSquare,
  StickyNote,
  HelpCircle,
  Sparkles,
  Paperclip,
  PhoneCall,
  Send,
  BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/atoms'
import { toast } from '@/components/molecules/Toast'
import { TasksPanel } from '@/features/tasks'
import { DealsPanel } from '@/features/deals'
import type { Territory } from '@/features/prospects/types'
import { ProspectSalesQaPanel } from '@/features/prospects/ProspectSalesQaPanel'
import { ProspectLeftWorkspaceFitPanel } from '@/features/prospects/ProspectLeftWorkspaceFitPanel'
import { ProspectArtifactsPanel } from '@/features/prospects/ProspectArtifactsPanel'
import { ProspectQuickNotePanel } from '@/features/prospects/ProspectQuickNotePanel'
import { ProspectPlaybookReader } from '@/features/prospects/ProspectPlaybookReader'
import { openEasybellCall, openIonosEmail } from '@/lib/comms'
import {
  prospectSideRailTabListShell,
  prospectSideRailTabListClass,
  prospectSideRailTabPanelsClass,
  prospectSideRailTabPanelClass,
  prospectSideRailPanelBody,
} from '@/features/prospects/prospectSideRailChrome'
import {
  studioRelationsRailTabPanel,
  studioRelationsRailTabBody,
  studioSettingsRailBodyTop,
} from '@/features/studio-settings/studioBlockChrome'
import { tabTriggerStudioRelationsClass } from '@/components/molecules/Tabs/tabListStyles'

interface ProspectRightActionPanelProps {
  prospectId: string
  territory: Territory
  primaryContactEmail: string | null
  primaryContactPhone: string | null
  accountName?: string | null
  suggestedPlaybookId?: string | null
}

export function ProspectRightActionPanel({
  prospectId,
  territory,
  primaryContactEmail,
  primaryContactPhone,
  accountName,
  suggestedPlaybookId,
}: ProspectRightActionPanelProps) {
  const { t } = useTranslation()

  const emailSubject = accountName
    ? t('prospects.workspace.commsEmailSubject', { company: accountName })
    : undefined

  const tools = [
    { id: 'tasks', icon: ClipboardCheck, label: t('prospects.workspace.toolTasks') },
    { id: 'notes', icon: StickyNote, label: t('prospects.workspace.toolNotes') },
    { id: 'artifacts', icon: Paperclip, label: t('prospects.workspace.toolArtifacts') },
    { id: 'email', icon: MessageSquare, label: t('prospects.workspace.toolEmail') },
    { id: 'script', icon: BookOpen, label: t('prospects.workspace.toolScript') },
    { id: 'qa', icon: HelpCircle, label: t('prospects.workspace.toolQa') },
    { id: 'deals', icon: Coins, label: t('dossier.tabs.deals') },
    { id: 'pitch', icon: Sparkles, label: t('prospects.workspace.toolPitch') },
  ]

  const iconStroke = { strokeWidth: 1.25 as const }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <TabGroup className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className={prospectSideRailTabListShell}>
          <TabList className={prospectSideRailTabListClass}>
            {tools.map(({ id, icon: Icon, label }) => (
              <Tab key={id} className={tabTriggerStudioRelationsClass} title={label} aria-label={label}>
                <Icon size={14} {...iconStroke} aria-hidden />
              </Tab>
            ))}
          </TabList>
        </div>
        <TabPanels className={prospectSideRailTabPanelsClass}>
          <TabPanel className={prospectSideRailTabPanelClass}>
            <TasksPanel prospectId={prospectId} territory={territory} />
          </TabPanel>
          <TabPanel className={prospectSideRailTabPanelClass}>
            <ProspectQuickNotePanel prospectId={prospectId} />
          </TabPanel>
          <TabPanel className={prospectSideRailTabPanelClass}>
            <ProspectArtifactsPanel prospectId={prospectId} />
          </TabPanel>
          <TabPanel className={prospectSideRailTabPanelClass}>
            <div className={prospectSideRailPanelBody}>
              <p className="text-xs text-muted">{t('prospects.workspace.commsHint')}</p>
              <div className="flex flex-col gap-2">
                {primaryContactPhone ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="w-full justify-center"
                    onClick={() => {
                      if (!openEasybellCall(primaryContactPhone)) {
                        toast(t('contacts.comms.invalidPhone'), 'error')
                      }
                    }}
                  >
                    <PhoneCall size={14} aria-hidden />
                    {t('contacts.actions.callEasybell')}
                  </Button>
                ) : (
                  <p className="text-xs text-muted">{t('prospects.workspace.noPrimaryPhone')}</p>
                )}
                {primaryContactEmail ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="w-full justify-center"
                    onClick={() => {
                      if (!openIonosEmail({ to: primaryContactEmail, subject: emailSubject })) {
                        toast(t('contacts.comms.invalidEmail'), 'error')
                      }
                    }}
                  >
                    <Send size={14} aria-hidden />
                    {t('contacts.actions.emailIonos')}
                  </Button>
                ) : (
                  <p className="text-xs text-muted">{t('prospects.workspace.noPrimaryEmail')}</p>
                )}
              </div>
              <Link
                href={`/prospects/${prospectId}/proposal`}
                className="block text-center text-xs font-medium text-primary underline-offset-4 hover:underline"
              >
                {t('prospects.workspace.attachProposal')}
              </Link>
            </div>
          </TabPanel>
          <TabPanel
            className={cn(
              studioRelationsRailTabPanel,
              studioSettingsRailBodyTop,
              'flex flex-col overflow-hidden px-3 pb-3',
            )}
          >
            <div className={cn(studioRelationsRailTabBody, 'w-full min-w-0')}>
              <ProspectPlaybookReader playbookId={suggestedPlaybookId} />
            </div>
          </TabPanel>
          <TabPanel className={prospectSideRailTabPanelClass}>
            <ProspectSalesQaPanel prospectId={prospectId} />
          </TabPanel>
          <TabPanel className={prospectSideRailTabPanelClass}>
            <DealsPanel prospectId={prospectId} />
          </TabPanel>
          <TabPanel className={prospectSideRailTabPanelClass}>
            <ProspectLeftWorkspaceFitPanel prospectId={prospectId} />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  )
}
