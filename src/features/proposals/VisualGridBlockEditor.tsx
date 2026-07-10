'use client'

import { useCallback, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical,
  Image as ImageIcon,
  Plus,
  RectangleHorizontal,
  RectangleVertical,
  Trash2,
  Type,
  Upload,
  X,
} from 'lucide-react'
import { Button } from '@/components/atoms'
import type { ProposalBlock, VisualCell, VisualRow } from '@/lib/proposals/blockSchema'
import { visualGridCellFlexGrow } from '@/lib/proposals/blockSchema'
import { cn } from '@/lib/cn'
import { toast } from '@/components/molecules/Toast'

function createCell(kind: 'image' | 'text'): VisualCell {
  const id = globalThis.crypto.randomUUID()
  if (kind === 'image') {
    return { id, kind: 'image', imageUrl: null, imageAspect: 'portrait' }
  }
  return { id, kind: 'text', heading: '', body: '' }
}

/** Keep stable sortable id when switching cell type in the editor */
function cellWithKind(id: string, kind: 'image' | 'text'): VisualCell {
  if (kind === 'image') {
    return { id, kind: 'image', imageUrl: null, imageAspect: 'portrait' }
  }
  return { id, kind: 'text', heading: '', body: '' }
}

function createRow(): VisualRow {
  return {
    id: globalThis.crypto.randomUUID(),
    cells: [createCell('text')],
  }
}

const fieldClass =
  'w-full min-w-0 rounded-sm border border-input/80 bg-background px-2.5 py-1.5 text-sm outline-none placeholder:text-muted/80 focus-visible:border-border focus-visible:ring-1 focus-visible:ring-primary/30'

/** ThemeToggle-style control rail (no extra chrome / shadows) */
const toggleRail = 'inline-flex h-8 shrink-0 items-center rounded-sm border border-border bg-background p-0.5'
const toggleIconBtn = (active: boolean) =>
  cn(
    'flex h-6 w-7 items-center justify-center rounded-sm transition-colors',
    active
      ? 'bg-active text-foreground'
      : 'text-muted hover:bg-hover hover:text-foreground',
  )

/** Avoid controlled/uncontrolled flicker when legacy JSON has null / wrong types */
function inputStr(v: unknown): string {
  if (v == null || (typeof v === 'number' && Number.isNaN(v))) return ''
  return typeof v === 'string' ? v : String(v)
}

type VisualGridBlock = Extract<ProposalBlock, { type: 'visual_grid' }>

function SortableRowChrome({
  id,
  children,
  dragLabel,
  toolbar,
}: {
  id: string
  children: ReactNode
  dragLabel: string
  toolbar: ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : 1,
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="min-w-0 overflow-hidden rounded-lg border border-border bg-card"
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-border/70 px-2.5 py-2">
        <button
          type="button"
          className="cursor-grab shrink-0 rounded-sm p-1.5 text-muted outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:cursor-grabbing"
          aria-label={dragLabel}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={15} strokeWidth={1.75} aria-hidden />
        </button>
        {toolbar}
      </div>
      <div className="p-2.5">{children}</div>
    </div>
  )
}

function SortableCellCard({
  cell,
  rowId,
  block,
  onChange,
  prospectId,
  proposalId,
  studioImageUpload,
  canRemove,
  onRemove,
}: {
  cell: VisualCell
  rowId: string
  block: VisualGridBlock
  onChange: (next: VisualGridBlock) => void
  prospectId: string
  proposalId: string | null
  studioImageUpload?: (file: File) => Promise<string | null>
  canRemove: boolean
  onRemove: () => void
}) {
  const { t } = useTranslation()
  const fileRef = useRef<HTMLInputElement>(null)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: cell.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : 1,
    flex: `${visualGridCellFlexGrow(cell)} 1 0%`,
  }

  const patchCell = useCallback(
    (nextCell: VisualCell) => {
      const rows = block.props.rows.map((r) => {
        if (r.id !== rowId) return r
        return {
          ...r,
          cells: r.cells.map((c) => (c.id === cell.id ? nextCell : c)),
        }
      })
      onChange({ ...block, props: { ...block.props, rows } })
    },
    [block, onChange, rowId, cell.id],
  )

  const setKind = (kind: 'image' | 'text') => {
    if (cell.kind === kind) return
    patchCell(cellWithKind(cell.id, kind))
  }

  const allowImagePick = Boolean(studioImageUpload) || Boolean(proposalId)

  const imageDropExt = /\.(png|jpe?g|gif|webp|avif|bmp|svg|tiff?)$/i
  function looksLikeImageDrop(file: File): boolean {
    return file.type.startsWith('image/') || imageDropExt.test(file.name)
  }

  const [uploadDropActive, setUploadDropActive] = useState(false)

  async function ingestImageFile(file: File) {
    if (studioImageUpload) {
      const url = await studioImageUpload(file)
      if (url) {
        patchCell({
          id: cell.id,
          kind: 'image',
          imageUrl: url,
          imageAspect: cell.kind === 'image' ? (cell.imageAspect ?? 'portrait') : 'portrait',
        })
      }
      return
    }

    if (!proposalId) {
      toast(t('proposals.visualGrid.saveProposalFirst'), 'error')
      return
    }
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(
      `/api/prospects/${prospectId}/proposals/${proposalId}/upload-media`,
      {
        method: 'POST',
        body: fd,
        credentials: 'include',
      },
    )
    if (!res.ok) {
      toast(t('error.somethingWentWrong'), 'error')
      return
    }
    const data = (await res.json()) as { url?: string }
    if (data.url) {
      patchCell({
        id: cell.id,
        kind: 'image',
        imageUrl: data.url,
        imageAspect: cell.kind === 'image' ? (cell.imageAspect ?? 'portrait') : 'portrait',
      })
    }
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    await ingestImageFile(file)
  }

  const onUploadDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }
  const onUploadDragEnter = (e: React.DragEvent) => {
    if (!allowImagePick) return
    e.preventDefault()
    e.stopPropagation()
    setUploadDropActive(true)
  }
  const onUploadDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setUploadDropActive(false)
  }
  const onUploadDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setUploadDropActive(false)
    if (!allowImagePick) return
    const file = e.dataTransfer.files?.[0]
    if (!file || !looksLikeImageDrop(file)) return
    await ingestImageFile(file)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex min-h-0 min-w-0 max-w-full flex-col self-stretch overflow-hidden rounded-lg border border-border/80 bg-card"
    >
      <div className="flex w-full min-w-0 items-center gap-2 border-b border-border/60 px-2 py-1.5">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
          <button
            type="button"
            className="cursor-grab shrink-0 rounded-sm p-1.5 text-muted outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:cursor-grabbing"
            aria-label={t('proposals.visualGrid.dragCell')}
            {...attributes}
            {...listeners}
          >
            <GripVertical size={14} strokeWidth={1.75} aria-hidden />
          </button>

          <div className={toggleRail} role="group" aria-label={t('proposals.visualGrid.kindGroup')}>
            <button
              type="button"
              className={toggleIconBtn(cell.kind === 'text')}
              title={t('proposals.visualGrid.kindText')}
              onClick={() => setKind('text')}
            >
              <Type size={14} strokeWidth={1.75} aria-hidden />
            </button>
            <button
              type="button"
              className={toggleIconBtn(cell.kind === 'image')}
              title={t('proposals.visualGrid.kindImage')}
              onClick={() => setKind('image')}
            >
              <ImageIcon size={14} strokeWidth={1.75} aria-hidden />
            </button>
          </div>

          {cell.kind === 'image' ? (
            <div className={toggleRail} role="group" aria-label={t('proposals.visualGrid.imageAspectGroup')}>
              <button
                type="button"
                className={toggleIconBtn((cell.imageAspect ?? 'portrait') === 'portrait')}
                title={t('proposals.visualGrid.imageAspectPortrait')}
                onClick={() => patchCell({ ...cell, imageAspect: 'portrait' })}
              >
                <RectangleVertical size={14} strokeWidth={1.75} aria-hidden />
              </button>
              <button
                type="button"
                className={toggleIconBtn((cell.imageAspect ?? 'portrait') === 'landscape')}
                title={t('proposals.visualGrid.imageAspectLandscape')}
                onClick={() => patchCell({ ...cell, imageAspect: 'landscape' })}
              >
                <RectangleHorizontal size={14} strokeWidth={1.75} aria-hidden />
              </button>
            </div>
          ) : null}
        </div>

        {canRemove ? (
          <button
            type="button"
            className="shrink-0 rounded-sm p-1.5 text-muted transition-colors hover:bg-destructive/10 hover:text-destructive"
            aria-label={t('proposals.visualGrid.removeCell')}
            onClick={onRemove}
          >
            <Trash2 size={14} strokeWidth={1.75} />
          </button>
        ) : null}
      </div>

      <div key={`${cell.id}-${cell.kind}`} className="flex min-h-0 flex-1 flex-col gap-2.5 px-2.5 pb-2.5 pt-2">
        {cell.kind === 'image' ? (
          <>
            <div className="flex min-h-0 flex-1 flex-col justify-center">
              {cell.imageUrl ? (
                <div
                  className={cn(
                    'group relative w-full shrink-0 overflow-hidden rounded-lg border border-border/50 bg-muted/10',
                    (cell.imageAspect ?? 'portrait') === 'landscape' ? 'aspect-video' : 'aspect-3/4',
                  )}
                >
                  <img
                    src={cell.imageUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      patchCell({
                        id: cell.id,
                        kind: 'image',
                        imageUrl: null,
                        imageAspect: cell.kind === 'image' ? (cell.imageAspect ?? 'portrait') : 'portrait',
                      })
                    }
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-sm border border-border bg-background text-foreground opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label={t('editor.remove')}
                  >
                    <X size={14} aria-hidden />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={!allowImagePick}
                  onClick={() => allowImagePick && fileRef.current?.click()}
                  onDragOver={onUploadDragOver}
                  onDragEnter={onUploadDragEnter}
                  onDragLeave={onUploadDragLeave}
                  onDrop={onUploadDrop}
                  className={cn(
                    'flex w-full shrink-0 flex-col items-center justify-center gap-2 rounded-lg border border-dashed transition-colors',
                    (cell.imageAspect ?? 'portrait') === 'landscape' ? 'aspect-video' : 'aspect-3/4',
                    uploadDropActive
                      ? 'border-foreground/35 bg-muted/45 text-foreground'
                      : 'border-border/35 bg-muted/10 text-muted hover:border-foreground/25 hover:bg-muted/25 hover:text-foreground',
                    allowImagePick && 'cursor-pointer',
                    !allowImagePick && 'pointer-events-none cursor-not-allowed opacity-50',
                  )}
                >
                  <Upload size={24} strokeWidth={1.5} aria-hidden />
                  <span className="max-w-48 text-center text-xs leading-snug">
                    {t('proposals.visualGrid.tapOrUpload')}
                  </span>
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,image/svg+xml,.svg"
              className="hidden"
              onChange={onPickFile}
            />
            <div className="flex shrink-0 min-w-0 gap-2">
              <input
                className={fieldClass}
                value={inputStr(cell.imageUrl)}
                onChange={(e) =>
                  patchCell({
                    id: cell.id,
                    kind: 'image',
                    imageUrl: e.target.value.trim() || null,
                    imageAspect: cell.kind === 'image' ? (cell.imageAspect ?? 'portrait') : 'portrait',
                  })
                }
                placeholder={t('proposals.visualGrid.imageUrlPlaceholder')}
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-9 shrink-0 px-2.5"
                disabled={!allowImagePick}
                title={t('proposals.visualGrid.uploadImage')}
                onClick={() => fileRef.current?.click()}
              >
                <ImageIcon size={15} aria-hidden />
              </Button>
            </div>
          </>
        ) : (
          <>
            <input
              className={fieldClass}
              value={inputStr(cell.heading)}
              onChange={(e) =>
                patchCell({
                  id: cell.id,
                  kind: 'text',
                  heading: e.target.value,
                  body: inputStr(cell.body),
                })
              }
              placeholder={t('proposals.fields.headline')}
            />
            <textarea
              className={cn(fieldClass, 'min-h-[72px] resize-y')}
              value={inputStr(cell.body)}
              onChange={(e) =>
                patchCell({
                  id: cell.id,
                  kind: 'text',
                  heading: inputStr(cell.heading),
                  body: e.target.value,
                })
              }
              placeholder={t('proposals.fields.body')}
            />
          </>
        )}
      </div>
    </div>
  )
}

function RowEditor({
  row,
  rowIndex,
  block,
  onChange,
  prospectId,
  proposalId,
  studioImageUpload,
  canRemoveRow,
  onRemoveRow,
}: {
  row: VisualRow
  rowIndex: number
  block: VisualGridBlock
  onChange: (next: ProposalBlock) => void
  prospectId: string
  proposalId: string | null
  studioImageUpload?: (file: File) => Promise<string | null>
  canRemoveRow: boolean
  onRemoveRow: () => void
}) {
  const { t } = useTranslation()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onCellsDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      const oldIndex = row.cells.findIndex((c) => c.id === active.id)
      const newIndex = row.cells.findIndex((c) => c.id === over.id)
      if (oldIndex < 0 || newIndex < 0) return
      const cells = arrayMove(row.cells, oldIndex, newIndex)
      const rows = block.props.rows.map((r) => (r.id === row.id ? { ...r, cells } : r))
      onChange({ ...block, props: { ...block.props, rows } })
    },
    [block, onChange, row],
  )

  const addCell = () => {
    if (row.cells.length >= 5) return
    const cells = [...row.cells, createCell('image')]
    const rows = block.props.rows.map((r) => (r.id === row.id ? { ...r, cells } : r))
    onChange({ ...block, props: { ...block.props, rows } })
  }

  const removeCell = (cellId: string) => {
    if (row.cells.length <= 1) return
    const cells = row.cells.filter((c) => c.id !== cellId)
    const rows = block.props.rows.map((r) => (r.id === row.id ? { ...r, cells } : r))
    onChange({ ...block, props: { ...block.props, rows } })
  }

  const rowToolbar = (
    <>
      <span className="min-w-0 flex-1 truncate text-[11px] font-medium uppercase tracking-wider text-muted">
        {t('proposals.visualGrid.rowLabel', { n: rowIndex + 1 })}
      </span>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="h-8 shrink-0 gap-1 rounded-sm px-2.5 text-xs"
        onClick={addCell}
        disabled={row.cells.length >= 5}
      >
        <Plus size={12} />
        {t('proposals.visualGrid.addCell')}
      </Button>
      {canRemoveRow ? (
        <button
          type="button"
          className="shrink-0 rounded-sm p-1.5 text-muted transition-colors hover:bg-destructive/10 hover:text-destructive"
          aria-label={t('proposals.visualGrid.removeRow')}
          onClick={onRemoveRow}
        >
          <Trash2 size={14} strokeWidth={1.75} />
        </button>
      ) : null}
    </>
  )

  return (
    <SortableRowChrome id={row.id} dragLabel={t('proposals.visualGrid.dragRow')} toolbar={rowToolbar}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onCellsDragEnd}>
        <SortableContext items={row.cells.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
          <div className="flex min-h-0 flex-row items-stretch gap-2.5 overflow-x-auto pb-0.5">
            {row.cells.map((cell) => (
              <SortableCellCard
                key={cell.id}
                cell={cell}
                rowId={row.id}
                block={block}
                onChange={onChange}
                prospectId={prospectId}
                proposalId={proposalId}
                studioImageUpload={studioImageUpload}
                canRemove={row.cells.length > 1}
                onRemove={() => removeCell(cell.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </SortableRowChrome>
  )
}

export function VisualGridBlockEditor({
  block,
  onChange,
  prospectId,
  proposalId,
  studioImageUpload,
}: {
  block: VisualGridBlock
  onChange: (next: ProposalBlock) => void
  prospectId: string
  proposalId: string | null
  /** When set (e.g. Studio settings), image files become data URLs instead of proposal upload API. */
  studioImageUpload?: (file: File) => Promise<string | null>
}) {
  const { t } = useTranslation()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onRowsDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      const oldIndex = block.props.rows.findIndex((r) => r.id === active.id)
      const newIndex = block.props.rows.findIndex((r) => r.id === over.id)
      if (oldIndex < 0 || newIndex < 0) return
      const rows = arrayMove(block.props.rows, oldIndex, newIndex)
      onChange({ ...block, props: { ...block.props, rows } })
    },
    [block, onChange],
  )

  const addRow = () => {
    const rows = [...block.props.rows, createRow()]
    onChange({ ...block, props: { ...block.props, rows } })
  }

  const removeRow = (rowId: string) => {
    if (block.props.rows.length <= 1) return
    const rows = block.props.rows.filter((r) => r.id !== rowId)
    onChange({ ...block, props: { ...block.props, rows } })
  }

  return (
    <div className="grid min-w-0 gap-4">
      <input
        className={cn(fieldClass, 'font-medium')}
        value={block.props.sectionTitle ?? ''}
        onChange={(e) =>
          onChange({
            ...block,
            props: { ...block.props, sectionTitle: e.target.value },
          })
        }
        placeholder={t('proposals.visualGrid.sectionTitlePlaceholder')}
      />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onRowsDragEnd}>
        <SortableContext items={block.props.rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {block.props.rows.map((row, idx) => (
              <RowEditor
                key={row.id}
                row={row}
                rowIndex={idx}
                block={block}
                onChange={onChange}
                prospectId={prospectId}
                proposalId={proposalId}
                studioImageUpload={studioImageUpload}
                canRemoveRow={block.props.rows.length > 1}
                onRemoveRow={() => removeRow(row.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button type="button" size="sm" variant="secondary" className="h-9 rounded-sm" onClick={addRow}>
        <Plus size={14} />
        {t('proposals.visualGrid.addRow')}
      </Button>
    </div>
  )
}
