'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { MoreVertical } from 'lucide-react'
import { formatDateTime } from '@/lib/intl/datetime'
import { cn } from '@/lib/cn'
import { studioRadiusBlock } from '@/features/studio-settings/studioBlockChrome'
import { Badge, Button, Label } from '@/components/atoms'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'
import { DropdownMenu } from '@/components/molecules/DropdownMenu'
import { Modal } from '@/components/molecules/Modal'
import { Select } from '@/components/molecules/Select'
import { toast } from '@/components/molecules/Toast'
import { useProspectProjectsQuery } from '@/features/client-projects/api/useProspectProjectsQuery'
import {
  copyProposalShareLink,
  deleteProposal,
  fetchProposalSharePath,
  publishProposal,
  unpublishProposal,
} from '@/features/proposals/lib/proposalClientActions'
import {
  buildProposalListMenuItems,
  type ProposalListMenuHandlers,
} from '@/features/proposals/lib/proposalListMenu'
import type { DocumentKind } from '@/lib/proposals/documentKind'

interface DocumentListItem {
  id: string
  title: string | null
  updatedAt: string
  status: 'draft' | 'published'
  version?: number
}

type ProspectDocumentsPanelProps = {
  prospectId: string
  documentKind: DocumentKind
}

export function ProspectDocumentsPanel({ prospectId, documentKind }: ProspectDocumentsPanelProps) {
  const { t, i18n } = useTranslation()
  const copyNs = documentKind === 'offer' ? 'offers' : 'proposals'
  const editorSegment = documentKind === 'offer' ? 'offer' : 'proposal'
  const listUrl = `/api/prospects/${prospectId}/proposals?kind=${documentKind}`

  const [items, setItems] = useState<DocumentListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [menuBusyId, setMenuBusyId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DocumentListItem | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [projectPickerOpen, setProjectPickerOpen] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const { data: projects = [] } = useProspectProjectsQuery(prospectId)

  const load = useCallback(() => {
    setLoading(true)
    void fetch(listUrl, { credentials: 'include', cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data: { items?: { proposal: DocumentListItem }[] }) =>
        setItems((data.items ?? []).map((row) => row.proposal)),
      )
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [listUrl])

  useEffect(() => {
    load()
  }, [load])

  function patchLocalItem(id: string, patch: Partial<DocumentListItem>) {
    setItems((current) => current.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  const runMenuAction = useCallback(async (proposalId: string, fn: () => Promise<void>) => {
    setMenuBusyId(proposalId)
    try {
      await fn()
    } finally {
      setMenuBusyId(null)
    }
  }, [])

  const menuHandlers: ProposalListMenuHandlers = {
    onOpen: (item) => {
      window.location.href = `/prospects/${prospectId}/${editorSegment}?proposalId=${encodeURIComponent(item.id)}`
    },
    onPublish: (item) => {
      void runMenuAction(item.id, async () => {
        try {
          await publishProposal(prospectId, item.id, false)
          patchLocalItem(item.id, { status: 'published' })
          toast(t(`${copyNs}.published`))
        } catch (e) {
          const msg = e instanceof Error ? e.message : t(`${copyNs}.publishFailed`)
          toast(msg, 'error')
        }
      })
    },
    onUnpublish: (item) => {
      void runMenuAction(item.id, async () => {
        try {
          await unpublishProposal(prospectId, item.id)
          patchLocalItem(item.id, { status: 'draft' })
          toast(t(`${copyNs}.unpublished`))
        } catch {
          toast(t(`${copyNs}.unpublishFailed`), 'error')
        }
      })
    },
    onCopyLink: (item) => {
      void runMenuAction(item.id, async () => {
        try {
          const url = await copyProposalShareLink(prospectId, item.id)
          if (!url) {
            toast(t(`${copyNs}.shareLinkUnavailable`), 'error')
            return
          }
          toast(t(`${copyNs}.linkCopied`))
        } catch {
          toast(t(`${copyNs}.shareLinkUnavailable`), 'error')
        }
      })
    },
    onOpenClientPage: (item) => {
      void runMenuAction(item.id, async () => {
        const path = await fetchProposalSharePath(prospectId, item.id)
        if (!path) {
          toast(t(`${copyNs}.shareLinkUnavailable`), 'error')
          return
        }
        window.open(`${window.location.origin}${path}`, '_blank', 'noopener,noreferrer')
      })
    },
    onDelete: (item) => {
      const target = items.find((row) => row.id === item.id)
      if (target) setDeleteTarget(target)
    },
    isBusy: (id) => menuBusyId === id || deleteBusy,
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return
    setDeleteBusy(true)
    try {
      await deleteProposal(prospectId, deleteTarget.id)
      setItems((current) => current.filter((p) => p.id !== deleteTarget.id))
      setDeleteTarget(null)
      toast(t(`${copyNs}.deleted`))
    } catch {
      toast(t(`${copyNs}.deleteFailed`), 'error')
    } finally {
      setDeleteBusy(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-muted">{t('common.loading')}</p>
  }

  const titleKey =
    documentKind === 'offer' ? 'prospects.workspace.offersTitle' : 'prospects.workspace.proposalsTitle'
  const emptyKey =
    documentKind === 'offer' ? 'prospects.workspace.offersEmpty' : 'prospects.workspace.proposalsEmpty'
  const createKey = documentKind === 'offer' ? 'offers.openEditor' : 'proposals.openEditor'

  function openCreateEditor() {
    if (documentKind !== 'offer') {
      window.location.href = `/prospects/${prospectId}/${editorSegment}`
      return
    }
    if (projects.length === 0) {
      toast(t('clientProjects.createProjectFirst'), 'error')
      return
    }
    if (projects.length === 1) {
      window.location.href = `/prospects/${prospectId}/offer?projectId=${encodeURIComponent(projects[0].id)}`
      return
    }
    setSelectedProjectId(projects[0]?.id ?? '')
    setProjectPickerOpen(true)
  }

  function confirmOfferProject() {
    if (!selectedProjectId) return
    setProjectPickerOpen(false)
    window.location.href = `/prospects/${prospectId}/offer?projectId=${encodeURIComponent(selectedProjectId)}`
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{t(titleKey)}</h2>
        <Button type="button" size="sm" onClick={openCreateEditor}>
          {t(createKey)}
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted">{t(emptyKey)}</p>
      ) : (
        <ul className="grid gap-2">
          {items.map((p) => (
            <li
              key={p.id}
              className={cn(
                studioRadiusBlock,
                'flex flex-wrap items-center gap-2 bg-foreground/4 px-3 py-2.5 dark:bg-white/5',
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium">{p.title ?? p.id}</p>
                  <Badge variant={p.status === 'published' ? 'success' : 'default'} size="sm">
                    {t(`proposals.status.${p.status}`)}
                  </Badge>
                </div>
                <p className="text-xs text-muted">{formatDateTime(p.updatedAt, i18n.language)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Link
                  href={`/prospects/${prospectId}/${editorSegment}?proposalId=${encodeURIComponent(p.id)}`}
                  className="inline-flex h-8 items-center justify-center rounded-sm border border-border px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-hover"
                >
                  {t('common.view')}
                </Link>
                <DropdownMenu
                  items={buildProposalListMenuItems(
                    t,
                    prospectId,
                    { id: p.id, title: p.title ?? p.id, status: p.status },
                    menuHandlers,
                  )}
                  trigger={
                    <button
                      type="button"
                      disabled={menuHandlers.isBusy(p.id)}
                      className={cn(
                        'inline-flex h-8 w-8 items-center justify-center rounded-sm text-muted transition-colors hover:bg-foreground/[0.07] hover:text-foreground dark:hover:bg-white/[0.08]',
                        menuHandlers.isBusy(p.id) && 'cursor-wait opacity-60',
                      )}
                      aria-label={t(`${copyNs}.actions`)}
                    >
                      <MoreVertical size={14} aria-hidden />
                    </button>
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => {
          if (!deleteBusy) setDeleteTarget(null)
        }}
        onConfirm={() => void handleDeleteConfirmed()}
        title={t(`${copyNs}.deleteProposalTitle`)}
        message={t(`${copyNs}.deleteProposalBody`, { title: deleteTarget?.title ?? '' })}
        variant="destructive"
        loading={deleteBusy}
        confirmLabel={t('common.delete')}
      />

      <Modal
        open={projectPickerOpen}
        onClose={() => setProjectPickerOpen(false)}
        title={t('clientProjects.pickProjectForOffer')}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>{t('clientProjects.fieldTitle')}</Label>
            <Select
              value={selectedProjectId}
              onChange={setSelectedProjectId}
              options={projects.map((p) => ({ value: p.id, label: p.title }))}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setProjectPickerOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="button" size="sm" disabled={!selectedProjectId} onClick={confirmOfferProject}>
              {t('common.confirm')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export function ProspectProposalsPanel({ prospectId }: { prospectId: string }) {
  return <ProspectDocumentsPanel prospectId={prospectId} documentKind="proposal" />
}

export function ProspectOffersPanel({ prospectId }: { prospectId: string }) {
  return <ProspectDocumentsPanel prospectId={prospectId} documentKind="offer" />
}
