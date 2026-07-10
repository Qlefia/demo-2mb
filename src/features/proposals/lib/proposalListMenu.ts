import type { TFunction } from 'i18next'
import {
  Copy,
  Download,
  ExternalLink,
  Pencil,
  Printer,
  Rocket,
  RotateCcw,
  SquarePen,
  Trash2,
} from 'lucide-react'
import type { DropdownMenuEntry } from '@/components/molecules/DropdownMenu'
import { openProposalPdf } from '@/features/proposals/lib/proposalClientActions'

export type ProposalListMenuItem = {
  id: string
  title: string
  status: 'draft' | 'published'
}

export type ProposalListMenuHandlers = {
  onOpen: (item: ProposalListMenuItem) => void
  onRename?: (item: ProposalListMenuItem) => void
  onPublish: (item: ProposalListMenuItem) => void
  onUnpublish: (item: ProposalListMenuItem) => void
  onCopyLink: (item: ProposalListMenuItem) => void
  onOpenClientPage: (item: ProposalListMenuItem) => void
  onDelete: (item: ProposalListMenuItem) => void
  isBusy: (id: string) => boolean
}

export function buildProposalListMenuItems(
  t: TFunction,
  prospectId: string,
  item: ProposalListMenuItem,
  handlers: ProposalListMenuHandlers,
): DropdownMenuEntry[] {
  const busy = handlers.isBusy(item.id)
  const isPublished = item.status === 'published'
  const pdfSource = isPublished ? 'published' : 'draft'

  const entries: DropdownMenuEntry[] = [
    {
      label: t('proposals.openInEditor'),
      icon: Pencil,
      disabled: busy,
      onClick: () => handlers.onOpen(item),
    },
  ]

  if (handlers.onRename) {
    entries.push({
      label: t('proposals.rename'),
      icon: SquarePen,
      disabled: busy,
      onClick: () => handlers.onRename!(item),
    })
  }

  entries.push(
    {
      label: t('proposals.publish'),
      icon: Rocket,
      disabled: busy || isPublished,
      onClick: () => handlers.onPublish(item),
    },
    {
      label: t('proposals.moveToDraft'),
      icon: RotateCcw,
      disabled: busy || !isPublished,
      onClick: () => handlers.onUnpublish(item),
    },
    { separator: true },
    {
      label: t('proposals.copyLink'),
      icon: Copy,
      disabled: busy || !isPublished,
      onClick: () => handlers.onCopyLink(item),
    },
    {
      label: t('proposals.openClientPage'),
      icon: ExternalLink,
      disabled: busy || !isPublished,
      onClick: () => handlers.onOpenClientPage(item),
    },
    { separator: true },
    {
      label: isPublished ? t('proposals.downloadPdfPublished') : t('proposals.downloadPdfDraft'),
      icon: Download,
      disabled: busy,
      onClick: () => openProposalPdf(prospectId, item.id, pdfSource),
    },
    {
      label: t('proposals.print'),
      icon: Printer,
      disabled: busy,
      onClick: () => openProposalPdf(prospectId, item.id, pdfSource),
    },
    { separator: true },
    {
      label: t('proposals.delete'),
      icon: Trash2,
      variant: 'destructive',
      disabled: busy,
      onClick: () => handlers.onDelete(item),
    },
  )

  return entries
}
