'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import {
  ChevronRight,
  ExternalLink,
  Folder,
  FolderInput,
  FolderPlus,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react'
import { Button, IconButton, Input, TextArea } from '@/components/atoms'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'
import { DropdownMenu, type DropdownMenuEntry } from '@/components/molecules/DropdownMenu'
import { ImageUpload } from '@/components/molecules/ImageUpload'
import { Modal } from '@/components/molecules/Modal'
import { Select } from '@/components/molecules/Select'
import { toast } from '@/components/molecules/Toast'
import {
  studioDualImageUploadGrid,
  studioMemberRow,
  studioMemberRowSelected,
  studioRadiusNested,
  studioSortableListCard,
} from '@/features/studio-settings/studioBlockChrome'
import { StudioAccentAddButton } from '@/features/studio-settings/components/StudioAccentAddButton'
import { prospectSideRailPanelBody } from '@/features/prospects/prospectSideRailChrome'
import {
  MAX_ARTIFACT_IMAGES,
  type ProspectArtifactImageDTO,
} from '@/features/prospects/lib/prospectArtifactsApi'
import {
  useProspectArtifactMutations,
  useProspectArtifacts,
  type ProspectArtifactDTO,
} from '@/features/prospects/lib/useProspectArtifacts'
import { cn } from '@/lib/cn'
import { tryNormalizeExternalUrl } from '@/lib/urls/normalizeExternalUrl'

type PendingImage = { id: string; file: File; url: string }

type SheetMode =
  | { type: 'folder-create' }
  | { type: 'folder-rename'; item: ProspectArtifactDTO }
  | { type: 'entry-create' }
  | { type: 'entry-edit'; item: ProspectArtifactDTO }
  | { type: 'move'; item: ProspectArtifactDTO }

function folderPath(
  items: ProspectArtifactDTO[],
  folderId: string | null,
): ProspectArtifactDTO[] {
  if (!folderId) return []
  const byId = new Map(items.map((i) => [i.id, i]))
  const path: ProspectArtifactDTO[] = []
  let cur = byId.get(folderId)
  while (cur?.kind === 'folder') {
    path.unshift(cur)
    cur = cur.parentId ? byId.get(cur.parentId) : undefined
  }
  return path
}

function folderOptions(
  items: ProspectArtifactDTO[],
  excludeId?: string,
): { value: string; label: string }[] {
  const folders = items.filter((i) => i.kind === 'folder' && i.id !== excludeId)
  return [
    { value: '', label: '—' },
    ...folders.map((f) => ({ value: f.id, label: f.title })),
  ]
}

function linkHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, '')
  } catch {
    return url
  }
}

function ArtifactEntryCard({
  item,
  onEdit,
  onMove,
  onDelete,
  t,
}: {
  item: ProspectArtifactDTO
  onEdit: () => void
  onMove: () => void
  onDelete: () => void
  t: (key: string, opts?: Record<string, unknown>) => string
}) {
  const extraImages = item.images.length > 1 ? item.images.length - 1 : 0
  const linkLabel = item.linkUrl ? linkHostname(item.linkUrl) : null

  return (
    <li className={cn(studioSortableListCard, 'items-stretch gap-2 p-2.5')}>
      {item.imageUrl ? (
        <button
          type="button"
          className={cn(
            studioRadiusNested,
            'relative w-21 min-h-15 shrink-0 cursor-pointer self-stretch overflow-hidden bg-foreground/[0.06] dark:bg-white/[0.08]',
          )}
          onClick={(e) => {
            e.stopPropagation()
            window.open(item.imageUrl!, '_blank', 'noopener')
          }}
          aria-label={t('prospects.workspace.artifacts.openScreenshot')}
        >
          <Image src={item.imageUrl} alt="" fill className="object-cover" unoptimized />
          {extraImages > 0 ? (
            <span className="absolute bottom-1 right-1 rounded-sm bg-background/95 px-1 py-px text-[9px] font-semibold tabular-nums text-foreground shadow-sm">
              +{extraImages}
            </span>
          ) : null}
        </button>
      ) : null}

      <div className="flex min-w-0 flex-1 items-start gap-1">
        <button
          type="button"
          onClick={onEdit}
          className="min-w-0 flex-1 cursor-pointer rounded-sm py-px text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <p className="text-sm font-medium leading-tight text-foreground">{item.title}</p>
          {item.body ? (
            <p className="mt-1 line-clamp-2 text-xs leading-snug text-foreground/70">{item.body}</p>
          ) : null}
        </button>

        <div className="flex shrink-0 items-center gap-0.5">
          {item.linkUrl ? (
            <a
              href={item.linkUrl}
              target="_blank"
              rel="noreferrer"
              title={linkLabel ?? undefined}
              aria-label={t('prospects.workspace.artifacts.openLink', { host: linkLabel })}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-sm text-muted transition-colors hover:bg-foreground/5 hover:text-primary"
            >
              <ExternalLink size={13} strokeWidth={1.5} aria-hidden />
            </a>
          ) : null}
          <EntryRowMenu onEdit={onEdit} onMove={onMove} onDelete={onDelete} t={t} />
        </div>
      </div>
    </li>
  )
}

export function ProspectArtifactsPanel({ prospectId }: { prospectId: string }) {
  const { t } = useTranslation()
  const [folderId, setFolderId] = useState<string | null>(null)
  const [sheet, setSheet] = useState<SheetMode | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [moveTarget, setMoveTarget] = useState('')
  const [remoteImages, setRemoteImages] = useState<ProspectArtifactImageDTO[]>([])
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])

  const { data: items = [], isLoading } = useProspectArtifacts(prospectId)
  const { createMutation, updateMutation, uploadMutation, deleteMutation } =
    useProspectArtifactMutations(prospectId)

  const visible = useMemo(() => {
    const inFolder = items.filter((i) => (i.parentId ?? null) === folderId)
    const folders = inFolder.filter((i) => i.kind === 'folder')
    const entries = inFolder.filter((i) => i.kind === 'entry')
    return [...folders, ...entries]
  }, [folderId, items])

  const crumbs = useMemo(() => folderPath(items, folderId), [folderId, items])
  const busy =
    createMutation.isPending ||
    updateMutation.isPending ||
    uploadMutation.isPending ||
    deleteMutation.isPending

  function clearPendingImages() {
    for (const img of pendingImages) {
      if (img.url.startsWith('blob:')) URL.revokeObjectURL(img.url)
    }
    setPendingImages([])
  }

  function resetSheet() {
    setSheet(null)
    setTitle('')
    setBody('')
    setLinkUrl('')
    setMoveTarget('')
    clearPendingImages()
    setRemoteImages([])
  }

  function openEntryCreate() {
    resetSheet()
    setSheet({ type: 'entry-create' })
  }

  function openFolderCreate() {
    resetSheet()
    setSheet({ type: 'folder-create' })
  }

  function openEntryEdit(item: ProspectArtifactDTO) {
    resetSheet()
    setTitle(item.title)
    setBody(item.body ?? '')
    setLinkUrl(item.linkUrl ?? '')
    setRemoteImages(item.images)
    setSheet({ type: 'entry-edit', item })
  }

  function openMove(item: ProspectArtifactDTO) {
    resetSheet()
    setMoveTarget(item.parentId ?? '')
    setSheet({ type: 'move', item })
  }

  async function handleAddImage(file: File) {
    const total = remoteImages.length + pendingImages.length
    if (total >= MAX_ARTIFACT_IMAGES) {
      toast(t('prospects.workspace.artifacts.imageLimit', { max: MAX_ARTIFACT_IMAGES }), 'error')
      return
    }

    if (sheet?.type === 'entry-edit') {
      try {
        const item = await uploadMutation.mutateAsync({ file, artifactId: sheet.item.id })
        setRemoteImages(item.images)
      } catch {
        toast(t('error.somethingWentWrong'), 'error')
      }
      return
    }

    const id = globalThis.crypto.randomUUID()
    setPendingImages((prev) => [...prev, { id, file, url: URL.createObjectURL(file) }])
  }

  async function handleRemoveRemote(path: string) {
    if (sheet?.type !== 'entry-edit') return
    try {
      const item = await updateMutation.mutateAsync({
        artifactId: sheet.item.id,
        input: { removeImagePath: path },
      })
      setRemoteImages(item.images)
    } catch {
      toast(t('error.somethingWentWrong'), 'error')
    }
  }

  function handleRemovePending(id: string) {
    setPendingImages((prev) => {
      const removed = prev.find((img) => img.id === id)
      if (removed?.url.startsWith('blob:')) URL.revokeObjectURL(removed.url)
      return prev.filter((img) => img.id !== id)
    })
  }

  async function saveEntry() {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      toast(t('prospects.workspace.artifacts.titleRequired'), 'error')
      return
    }

    const trimmedLink = linkUrl.trim()
    const normalizedLink = trimmedLink ? tryNormalizeExternalUrl(trimmedLink) : null
    if (trimmedLink && !normalizedLink) {
      toast(t('prospects.workspace.artifacts.invalidLink'), 'error')
      return
    }

    try {
      if (sheet?.type === 'entry-edit') {
        await updateMutation.mutateAsync({
          artifactId: sheet.item.id,
          input: {
            title: trimmedTitle,
            body: body.trim() || null,
            linkUrl: normalizedLink,
          },
        })
      } else if (sheet?.type === 'entry-create') {
        const entry = await createMutation.mutateAsync({
          kind: 'entry',
          title: trimmedTitle,
          body: body.trim() || undefined,
          linkUrl: normalizedLink ?? undefined,
          parentId: folderId,
        })
        for (const img of pendingImages) {
          await uploadMutation.mutateAsync({ file: img.file, artifactId: entry.id })
        }
      }
      resetSheet()
      toast(t('prospects.workspace.artifacts.saved'), 'success')
    } catch {
      toast(t('error.somethingWentWrong'), 'error')
    }
  }

  async function saveFolder() {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      toast(t('prospects.workspace.artifacts.titleRequired'), 'error')
      return
    }
    try {
      if (sheet?.type === 'folder-rename') {
        await updateMutation.mutateAsync({
          artifactId: sheet.item.id,
          input: { title: trimmedTitle },
        })
      } else {
        await createMutation.mutateAsync({
          kind: 'folder',
          title: trimmedTitle,
          parentId: folderId,
        })
      }
      resetSheet()
      toast(t('prospects.workspace.artifacts.saved'), 'success')
    } catch {
      toast(t('error.somethingWentWrong'), 'error')
    }
  }

  async function confirmMove() {
    if (sheet?.type !== 'move') return
    try {
      await updateMutation.mutateAsync({
        artifactId: sheet.item.id,
        input: { parentId: moveTarget || null },
      })
      resetSheet()
      toast(t('prospects.workspace.artifacts.moved'), 'success')
    } catch {
      toast(t('error.somethingWentWrong'), 'error')
    }
  }

  const moveFolderOpts = useMemo(() => {
    if (sheet?.type !== 'move') return []
    return folderOptions(items, sheet.item.kind === 'folder' ? sheet.item.id : undefined).map(
      (o, i) => (i === 0 ? { ...o, label: t('prospects.workspace.artifacts.root') } : o),
    )
  }, [items, sheet, t])

  return (
    <div className={prospectSideRailPanelBody}>
      <div className="flex w-full items-center justify-between gap-2">
        <p className="crm-meta-label">{t('prospects.workspace.artifacts.title')}</p>
        <IconButton
          icon={FolderPlus}
          variant="ghost"
          size="xs"
          disabled={busy}
          label={t('prospects.workspace.artifacts.newFolder')}
          onClick={openFolderCreate}
        />
      </div>

      {crumbs.length > 0 ? (
        <nav
          className="flex min-w-0 flex-wrap items-center gap-1 text-[11px] text-muted"
          aria-label={t('prospects.workspace.artifacts.breadcrumb')}
        >
          <button
            type="button"
            className="hover:text-foreground"
            onClick={() => setFolderId(null)}
          >
            {t('prospects.workspace.artifacts.root')}
          </button>
          {crumbs.map((c) => (
            <span key={c.id} className="inline-flex min-w-0 items-center gap-1">
              <ChevronRight size={12} aria-hidden />
              <button
                type="button"
                className="max-w-32 truncate hover:text-foreground"
                onClick={() => setFolderId(c.id)}
              >
                {c.title}
              </button>
            </span>
          ))}
        </nav>
      ) : null}

      {isLoading ? (
        <p className="w-full text-xs text-muted">{t('common.loading')}</p>
      ) : (
        <>
          {visible.length === 0 ? (
            <p className="w-full text-center text-xs text-muted">{t('prospects.workspace.artifacts.empty')}</p>
          ) : (
            <ul className="grid w-full gap-2">
              {visible.map((item) =>
                item.kind === 'folder' ? (
                  <li key={item.id}>
                    <div
                      className={cn(
                        studioMemberRow,
                        'w-full cursor-pointer items-center px-2 py-2',
                        folderId === item.id && studioMemberRowSelected,
                      )}
                      onClick={() => setFolderId(item.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setFolderId(item.id)
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <Folder size={14} className="shrink-0 text-muted" aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
                    {item.title}
                  </span>
                  <ChevronRight size={14} className="shrink-0 text-muted" aria-hidden />
                  <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                    <FolderRowMenu
                      onRename={() => {
                        setTitle(item.title)
                        setSheet({ type: 'folder-rename', item })
                      }}
                      onMove={() => openMove(item)}
                      onDelete={() => setDeleteId(item.id)}
                      t={t}
                    />
                  </div>
                </div>
              </li>
            ) : (
              <ArtifactEntryCard
                key={item.id}
                item={item}
                onEdit={() => openEntryEdit(item)}
                onMove={() => openMove(item)}
                onDelete={() => setDeleteId(item.id)}
                t={t}
              />
            ),
          )}
            </ul>
          )}
          <StudioAccentAddButton layout="block" disabled={busy} onClick={openEntryCreate}>
            {t('prospects.workspace.artifacts.addEntry')}
          </StudioAccentAddButton>
        </>
      )}

      <Modal
        open={sheet?.type === 'entry-create' || sheet?.type === 'entry-edit'}
        onClose={resetSheet}
        preventBackdropDismiss
        panelClassName="max-w-lg"
        title={
          sheet?.type === 'entry-edit'
            ? t('prospects.workspace.artifacts.editEntry')
            : t('prospects.workspace.artifacts.newEntry')
        }
        footer={
          <>
            <Button type="button" variant="secondary" size="sm" onClick={resetSheet} disabled={busy}>
              {t('common.cancel')}
            </Button>
            <Button type="button" variant="primary" size="sm" loading={busy} onClick={() => void saveEntry()}>
              {t('common.save')}
            </Button>
          </>
        }
      >
        <EntryForm
          title={title}
          body={body}
          linkUrl={linkUrl}
          remoteImages={remoteImages}
          pendingImages={pendingImages}
          onAddImage={handleAddImage}
          onRemoveRemote={(path) => void handleRemoveRemote(path)}
          onRemovePending={handleRemovePending}
          imageBusy={uploadMutation.isPending || updateMutation.isPending}
          onTitle={setTitle}
          onBody={setBody}
          onLinkUrl={setLinkUrl}
          t={t}
        />
      </Modal>

      <Modal
        open={sheet?.type === 'folder-create' || sheet?.type === 'folder-rename'}
        onClose={resetSheet}
        title={
          sheet?.type === 'folder-rename'
            ? t('prospects.workspace.artifacts.renameFolder')
            : t('prospects.workspace.artifacts.newFolder')
        }
        footer={
          <>
            <Button type="button" variant="secondary" size="sm" onClick={resetSheet} disabled={busy}>
              {t('common.cancel')}
            </Button>
            <Button type="button" variant="primary" size="sm" loading={busy} onClick={() => void saveFolder()}>
              {t('common.save')}
            </Button>
          </>
        }
      >
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('prospects.workspace.artifacts.folderPlaceholder')}
          autoFocus
        />
      </Modal>

      <Modal
        open={sheet?.type === 'move'}
        onClose={resetSheet}
        title={t('prospects.workspace.artifacts.moveToFolder')}
        footer={
          <>
            <Button type="button" variant="secondary" size="sm" onClick={resetSheet} disabled={busy}>
              {t('common.cancel')}
            </Button>
            <Button type="button" variant="primary" size="sm" loading={busy} onClick={() => void confirmMove()}>
              {t('prospects.workspace.artifacts.move')}
            </Button>
          </>
        }
      >
        <Select
          value={moveTarget}
          onChange={setMoveTarget}
          options={moveFolderOpts}
          placeholder={t('prospects.workspace.artifacts.root')}
        />
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        variant="destructive"
        loading={deleteMutation.isPending}
        title={t('common.delete')}
        message={t('prospects.workspace.artifacts.deleteConfirm')}
        onConfirm={() => {
          if (!deleteId) return
          void deleteMutation
            .mutateAsync(deleteId)
            .then(() => {
              setDeleteId(null)
              if (folderId === deleteId) setFolderId(null)
              toast(t('prospects.workspace.artifacts.deleted'), 'success')
            })
            .catch(() => toast(t('error.somethingWentWrong'), 'error'))
        }}
      />
    </div>
  )
}

function EntryForm({
  title,
  body,
  linkUrl,
  remoteImages,
  pendingImages,
  onAddImage,
  onRemoveRemote,
  onRemovePending,
  imageBusy,
  onTitle,
  onBody,
  onLinkUrl,
  t,
}: {
  title: string
  body: string
  linkUrl: string
  remoteImages: ProspectArtifactImageDTO[]
  pendingImages: PendingImage[]
  onAddImage: (file: File) => Promise<void>
  onRemoveRemote: (path: string) => void
  onRemovePending: (id: string) => void
  imageBusy: boolean
  onTitle: (v: string) => void
  onBody: (v: string) => void
  onLinkUrl: (v: string) => void
  t: (key: string, opts?: Record<string, unknown>) => string
}) {
  const total = remoteImages.length + pendingImages.length
  const canAdd = total < MAX_ARTIFACT_IMAGES

  return (
    <div className="space-y-3">
      <div>
        <label className="crm-meta-label mb-1 block" htmlFor="entry-title">
          {t('prospects.workspace.artifacts.fieldTitle')}
        </label>
        <Input
          id="entry-title"
          value={title}
          onChange={(e) => onTitle(e.target.value)}
          placeholder={t('prospects.workspace.artifacts.entryTitlePlaceholder')}
        />
      </div>
      <div>
        <label className="crm-meta-label mb-1 block" htmlFor="entry-body">
          {t('prospects.workspace.artifacts.fieldDescription')}
        </label>
        <TextArea
          id="entry-body"
          rows={4}
          value={body}
          onChange={(e) => onBody(e.target.value)}
          placeholder={t('prospects.workspace.artifacts.descriptionPlaceholder')}
        />
      </div>
      <div>
        <label className="crm-meta-label mb-1 block" htmlFor="entry-link">
          {t('prospects.workspace.artifacts.fieldUrl')}
        </label>
        <Input
          id="entry-link"
          type="text"
          inputMode="url"
          autoComplete="url"
          value={linkUrl}
          onChange={(e) => onLinkUrl(e.target.value)}
          placeholder="example.com"
        />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <p className="crm-meta-label">{t('prospects.workspace.artifacts.fieldImage')}</p>
          <span className="text-[10px] tabular-nums text-muted">
            {t('prospects.workspace.artifacts.imageCount', {
              count: total,
              max: MAX_ARTIFACT_IMAGES,
            })}
          </span>
        </div>
        <div className={studioDualImageUploadGrid}>
          {remoteImages.map((img) => (
            <ImageUpload
              key={img.path}
              value={img.url}
              onChange={(next) => {
                if (next === null) onRemoveRemote(img.path)
              }}
              aspect="16:9"
              cap="dualHero"
              placeholder={t('prospects.workspace.artifacts.addImage')}
            />
          ))}
          {pendingImages.map((img) => (
            <ImageUpload
              key={img.id}
              value={img.url}
              onChange={(next) => {
                if (next === null) onRemovePending(img.id)
              }}
              aspect="16:9"
              cap="dualHero"
            />
          ))}
          {canAdd ? (
            <ImageUpload
              value={null}
              onChange={() => {}}
              onUpload={async (file) => {
                await onAddImage(file)
                return null
              }}
              aspect="16:9"
              cap="dualHero"
              placeholder={
                imageBusy
                  ? t('common.loading')
                  : t('prospects.workspace.artifacts.addImage')
              }
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

function EntryRowMenu({
  onEdit,
  onMove,
  onDelete,
  t,
}: {
  onEdit: () => void
  onMove: () => void
  onDelete: () => void
  t: (key: string) => string
}) {
  const items: DropdownMenuEntry[] = [
    { label: t('common.edit'), icon: Pencil, onClick: onEdit },
    { label: t('prospects.workspace.artifacts.moveToFolder'), icon: FolderInput, onClick: onMove },
    { separator: true },
    { label: t('common.delete'), icon: Trash2, variant: 'destructive', onClick: onDelete },
  ]
  return (
    <DropdownMenu
      align="right"
      trigger={
        <IconButton icon={MoreVertical} variant="ghost" size="xs" label={t('common.actions')} />
      }
      items={items}
    />
  )
}

function FolderRowMenu({
  onRename,
  onMove,
  onDelete,
  t,
}: {
  onRename: () => void
  onMove: () => void
  onDelete: () => void
  t: (key: string) => string
}) {
  const items: DropdownMenuEntry[] = [
    { label: t('common.rename'), icon: Pencil, onClick: onRename },
    { label: t('prospects.workspace.artifacts.moveToFolder'), icon: FolderInput, onClick: onMove },
    { separator: true },
    { label: t('common.delete'), icon: Trash2, variant: 'destructive', onClick: onDelete },
  ]
  return (
    <DropdownMenu
      align="right"
      trigger={
        <IconButton icon={MoreVertical} variant="ghost" size="xs" label={t('common.actions')} />
      }
      items={items}
    />
  )
}
