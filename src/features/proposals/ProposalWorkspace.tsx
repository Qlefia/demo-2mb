'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowLeft, Copy, Download, GripVertical, MoreVertical, Plus, Printer, Send, Trash2 } from 'lucide-react'
import { Container, Button, IconButton, Badge } from '@/components/atoms'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'
import { DropdownMenu } from '@/components/molecules/DropdownMenu'
import { ProposalDeckPreview } from '@/features/proposals/ProposalDeckPreview'
import {
  About2mbBlockEditor,
  CoverBlockEditor,
  ProjectScopeBlockEditor,
  WhyUsBlockEditor,
} from '@/features/proposals/ordered-field-editors'
import { ServiceTagsBlockEditor } from '@/features/proposals/ServiceTagsBlockEditor'
import { SortableFieldRows } from '@/features/proposals/SortableFieldRows'
import { VisualGridBlockEditor } from '@/features/proposals/VisualGridBlockEditor'
import type { MergePackage } from '@/lib/proposals/mergeFields'
import { applyMergeToBlocks } from '@/lib/proposals/mergeFields'
import { applyStudioDefaultsToBlocks } from '@/lib/proposals/applyStudioDefaults'
import { deckCssVars } from '@/lib/proposals/deckLayout'
import type { StudioProposalDefaults } from '@/lib/proposals/studioProposalDefaults'
import type { ProposalBlock, ProposalBlockType } from '@/lib/proposals/blockSchema'
import { createEmptyBlock, parseProposalBlocks } from '@/lib/proposals/blockSchema'
import type { ProposalPresetId } from '@/lib/proposals/presets'
import type { DocumentKind } from '@/lib/proposals/documentKind'
import { truncateLabel } from '@/lib/format/truncateLabel'
import {
  studioBlockStack,
  studioMemberRow,
  studioMemberRowSelected,
  studioSectionTitleClass,
  studioSortableStack,
  studioTintPanel,
} from '@/features/studio-settings/studioBlockChrome'
import { cn } from '@/lib/cn'
import { toast } from '@/components/molecules/Toast'
import {
  buildProposalListMenuItems,
  type ProposalListMenuHandlers,
} from '@/features/proposals/lib/proposalListMenu'
import {
  copyProposalShareLink,
  fetchProposalSharePath,
  openProposalPdf,
  publishProposal,
  unpublishProposal,
} from '@/features/proposals/lib/proposalClientActions'
import {
  defaultStudioTemplateId,
  studioTemplatesFromGeneral,
} from '@/features/proposals/lib/studioDocumentTemplates'
import {
  fetchStudioSettings,
  STUDIO_SETTINGS_QUERY_KEY,
} from '@/features/studio-settings/lib/studioSettingsApi'

type ProposalDto = {
  id: string
  prospectId: string
  title: string
  blocks: unknown
  language: 'de' | 'en'
  version: number
  status: 'draft' | 'published'
  publishedVersionId: string | null
  metadata: Record<string, unknown>
  issuedAt: string | null
  validityDays: number
  projectName: string | null
  projectId: string | null
  createdAt: string
  updatedAt: string
}

const proposalFieldClass =
  'w-full min-w-0 rounded-md border border-input bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted focus-visible:ring-1 focus-visible:ring-primary'

const blockTypePickerSelectClass =
  'h-8 min-w-0 max-w-[min(100%,18rem)] shrink rounded-md border border-input bg-background px-2 text-xs outline-none focus-visible:ring-1 focus-visible:ring-primary'

function SectionSurfaceControl({
  value,
  onChange,
}: {
  value: 'deck' | 'letterhead'
  onChange: (next: 'deck' | 'letterhead') => void
}) {
  const { t } = useTranslation()
  return (
    <label className="flex flex-wrap items-center gap-2 text-xs text-muted">
      <span className="shrink-0">{t('proposals.fields.sectionSurface')}</span>
      <select
        className={cn(proposalFieldClass, 'h-8 max-w-[14rem]')}
        value={value}
        onChange={(e) => onChange(e.target.value as 'deck' | 'letterhead')}
      >
        <option value="deck">{t('proposals.fields.sectionSurfaceDeck')}</option>
        <option value="letterhead">{t('proposals.fields.sectionSurfaceLetterhead')}</option>
      </select>
    </label>
  )
}

function ImageComparisonBlockFields({
  block,
  onChange,
  prospectId,
  proposalId,
}: {
  block: Extract<ProposalBlock, { type: 'image_comparison' }>
  onChange: (next: ProposalBlock) => void
  prospectId: string
  proposalId: string | null
}) {
  const { t } = useTranslation()
  const fileRef = useRef<HTMLInputElement>(null)
  const targetRef = useRef<'before' | 'after'>('before')

  const applyUpload = async (file: File, target: 'before' | 'after') => {
    if (!proposalId) {
      toast(t('proposals.visualGrid.saveProposalFirst'), 'error')
      return
    }
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(
      `/api/prospects/${prospectId}/proposals/${proposalId}/upload-media`,
      { method: 'POST', body: fd, credentials: 'include' },
    )
    if (!res.ok) {
      toast(t('error.somethingWentWrong'), 'error')
      return
    }
    const data = (await res.json()) as { url?: string }
    if (!data.url) return
    if (target === 'before') {
      onChange({
        ...block,
        props: { ...block.props, beforeUrl: data.url },
      })
    } else {
      onChange({
        ...block,
        props: { ...block.props, afterUrl: data.url },
      })
    }
  }

  return (
    <div className="grid min-w-0 gap-2">
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (f) void applyUpload(f, targetRef.current)
        }}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-1">
          <span className="text-xs font-medium text-muted">{t('proposals.imageComparison.before')}</span>
          <input
            className={proposalFieldClass}
            value={block.props.beforeUrl ?? ''}
            onChange={(e) =>
              onChange({
                ...block,
                props: { ...block.props, beforeUrl: e.target.value.trim() || null },
              })
            }
            placeholder={t('proposals.fields.caseImageUrl')}
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-8"
            disabled={!proposalId}
            onClick={() => {
              targetRef.current = 'before'
              fileRef.current?.click()
            }}
          >
            {t('proposals.visualGrid.uploadImage')}
          </Button>
        </div>
        <div className="grid gap-1">
          <span className="text-xs font-medium text-muted">{t('proposals.imageComparison.after')}</span>
          <input
            className={proposalFieldClass}
            value={block.props.afterUrl ?? ''}
            onChange={(e) =>
              onChange({
                ...block,
                props: { ...block.props, afterUrl: e.target.value.trim() || null },
              })
            }
            placeholder={t('proposals.fields.caseImageUrl')}
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-8"
            disabled={!proposalId}
            onClick={() => {
              targetRef.current = 'after'
              fileRef.current?.click()
            }}
          >
            {t('proposals.visualGrid.uploadImage')}
          </Button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <input
          className={proposalFieldClass}
          value={block.props.beforeLabel ?? ''}
          onChange={(e) =>
            onChange({
              ...block,
              props: { ...block.props, beforeLabel: e.target.value },
            })
          }
          placeholder={t('proposals.imageComparison.beforeLabel')}
        />
        <input
          className={proposalFieldClass}
          value={block.props.afterLabel ?? ''}
          onChange={(e) =>
            onChange({
              ...block,
              props: { ...block.props, afterLabel: e.target.value },
            })
          }
          placeholder={t('proposals.imageComparison.afterLabel')}
        />
      </div>

      <label className="flex flex-col gap-1 text-xs text-muted">
        {t('proposals.imageComparison.splitDefault')}
        <input
          type="range"
          min={0}
          max={100}
          value={block.props.initialSplitPercent ?? 50}
          onChange={(e) =>
            onChange({
              ...block,
              props: {
                ...block.props,
                initialSplitPercent: Number(e.target.value),
              },
            })
          }
          className="accent-primary"
        />
      </label>
    </div>
  )
}

function SortableBlockRow({
  block,
  onRemove,
  children,
}: {
  block: ProposalBlock
  onRemove: () => void
  children: ReactNode
}) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="min-w-0 overflow-hidden rounded-md border border-border bg-background"
    >
      <div className="flex h-9 items-center gap-0.5 border-b border-border bg-muted/25 px-1">
        <IconButton
          icon={GripVertical}
          label={t('proposals.reorderBlock')}
          variant="ghost"
          size="sm"
          className="shrink-0 cursor-grab text-muted active:cursor-grabbing hover:bg-transparent! active:bg-transparent! hover:text-muted!"
          {...attributes}
          {...listeners}
        />
        <span className="min-w-0 flex-1 truncate px-1 text-xs font-semibold uppercase tracking-wide text-foreground">
          {t(`proposals.blockTypes.${block.type}`)}
        </span>
        <IconButton
          icon={Trash2}
          label={t('proposals.removeBlock')}
          variant="destructive"
          size="sm"
          className="shrink-0"
          onClick={onRemove}
        />
      </div>
      <div className="space-y-3 p-3">{children}</div>
    </div>
  )
}

function BlockFields({
  block,
  onChange,
  prospectId,
  proposalId,
  proposalLanguage,
}: {
  block: ProposalBlock
  onChange: (next: ProposalBlock) => void
  prospectId: string
  proposalId: string | null
  proposalLanguage: 'de' | 'en'
}) {
  const { t } = useTranslation()
  const field = proposalFieldClass

  switch (block.type) {
    case 'cover':
      return <CoverBlockEditor block={block} onChange={onChange} field={field} />
    case 'service_tags':
      return (
        <ServiceTagsBlockEditor
          block={block}
          onChange={onChange}
          proposalLanguage={proposalLanguage}
          field={field}
        />
      )
    case 'why_us':
      return <WhyUsBlockEditor block={block} onChange={onChange} field={field} />
    case 'about_2mb':
      return <About2mbBlockEditor block={block} onChange={onChange} field={field} />
    case 'testimonials':
      return (
        <div className="grid min-w-0 gap-3">
          <input
            className={field}
            value={block.props.title}
            onChange={(e) =>
              onChange({ ...block, props: { ...block.props, title: e.target.value } })
            }
            placeholder={t('proposals.fields.sectionTitle')}
          />
          <SortableFieldRows
            blockId={`${block.id}::items`}
            itemIds={block.props.items.map((_, i) => String(i))}
            alignStart
            listLabel={t('proposals.sortFieldsInBlock')}
            onReorder={(next) => {
              const items = next.map((i) => block.props.items[Number(i)])
              onChange({ ...block, props: { ...block.props, items } })
            }}
          >
            {(idxStr, handle) => {
              const idx = Number(idxStr)
              const it = block.props.items[idx]
              if (!it) return null
              return (
                <>
                  {handle}
                  <div className="relative grid min-w-0 flex-1 gap-1 rounded border border-border p-2 pt-8">
                    {block.props.items.length > 1 ? (
                      <button
                        type="button"
                        className="absolute right-1 top-1 rounded p-1 text-muted hover:bg-destructive/10 hover:text-destructive"
                        aria-label={t('proposals.editor.removeItem')}
                        onClick={() => {
                          const items = block.props.items.filter((_, i) => i !== idx)
                          onChange({ ...block, props: { ...block.props, items } })
                        }}
                      >
                        <Trash2 size={14} aria-hidden />
                      </button>
                    ) : null}
                    <textarea
                      className={cn(field, 'min-h-[48px]')}
                      value={it.quote}
                      onChange={(e) => {
                        const items = [...block.props.items]
                        items[idx] = { ...items[idx], quote: e.target.value }
                        onChange({ ...block, props: { ...block.props, items } })
                      }}
                      placeholder={t('proposals.fields.quote')}
                    />
                    <input
                      className={field}
                      value={it.name}
                      onChange={(e) => {
                        const items = [...block.props.items]
                        items[idx] = { ...items[idx], name: e.target.value }
                        onChange({ ...block, props: { ...block.props, items } })
                      }}
                      placeholder={t('proposals.fields.name')}
                    />
                    <input
                      className={field}
                      value={it.role}
                      onChange={(e) => {
                        const items = [...block.props.items]
                        items[idx] = { ...items[idx], role: e.target.value }
                        onChange({ ...block, props: { ...block.props, items } })
                      }}
                      placeholder={t('proposals.fields.role')}
                    />
                    <input
                      className={field}
                      value={it.company}
                      onChange={(e) => {
                        const items = [...block.props.items]
                        items[idx] = { ...items[idx], company: e.target.value }
                        onChange({ ...block, props: { ...block.props, items } })
                      }}
                      placeholder={t('proposals.fields.company')}
                    />
                  </div>
                </>
              )
            }}
          </SortableFieldRows>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-8 w-fit gap-1"
            onClick={() =>
              onChange({
                ...block,
                props: {
                  ...block.props,
                  items: [
                    ...block.props.items,
                    { quote: '', name: '', role: '', company: '' },
                  ],
                },
              })
            }
          >
            <Plus size={14} aria-hidden />
            {t('proposals.editor.addTestimonial')}
          </Button>
        </div>
      )
    case 'comparable_cases':
      return (
        <div className="grid min-w-0 gap-2">
          <input
            className={field}
            value={block.props.title}
            onChange={(e) =>
              onChange({ ...block, props: { ...block.props, title: e.target.value } })
            }
            placeholder={t('proposals.fields.sectionTitle')}
          />
          <SortableFieldRows
            blockId={`${block.id}::cases`}
            itemIds={block.props.cases.map((_, i) => String(i))}
            alignStart
            listLabel={t('proposals.sortFieldsInBlock')}
            onReorder={(next) => {
              const cases = next.map((i) => block.props.cases[Number(i)])
              onChange({ ...block, props: { ...block.props, cases } })
            }}
          >
            {(idxStr, handle) => {
              const idx = Number(idxStr)
              const c = block.props.cases[idx]
              if (!c) return null
              return (
                <>
                  {handle}
                  <div className="relative grid min-w-0 flex-1 gap-1 rounded border border-border/80 p-2 pt-8">
                    {block.props.cases.length > 1 ? (
                      <button
                        type="button"
                        className="absolute right-1 top-1 rounded p-1 text-muted hover:bg-destructive/10 hover:text-destructive"
                        aria-label={t('proposals.editor.removeItem')}
                        onClick={() => {
                          const cases = block.props.cases.filter((_, i) => i !== idx)
                          onChange({ ...block, props: { ...block.props, cases } })
                        }}
                      >
                        <Trash2 size={14} aria-hidden />
                      </button>
                    ) : null}
                    <input
                      className={field}
                      value={c.name}
                      onChange={(e) => {
                        const cases = [...block.props.cases]
                        cases[idx] = { ...cases[idx], name: e.target.value }
                        onChange({ ...block, props: { ...block.props, cases } })
                      }}
                      placeholder={t('proposals.fields.caseName')}
                    />
                    <input
                      className={field}
                      value={c.line}
                      onChange={(e) => {
                        const cases = [...block.props.cases]
                        cases[idx] = { ...cases[idx], line: e.target.value }
                        onChange({ ...block, props: { ...block.props, cases } })
                      }}
                      placeholder={t('proposals.fields.caseLine')}
                    />
                    <input
                      className={field}
                      value={c.imageUrl ?? ''}
                      onChange={(e) => {
                        const cases = [...block.props.cases]
                        cases[idx] = { ...cases[idx], imageUrl: e.target.value.trim() || null }
                        onChange({ ...block, props: { ...block.props, cases } })
                      }}
                      placeholder={t('proposals.fields.caseImageUrl')}
                    />
                  </div>
                </>
              )
            }}
          </SortableFieldRows>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-8 w-fit gap-1"
            onClick={() =>
              onChange({
                ...block,
                props: {
                  ...block.props,
                  cases: [...block.props.cases, { name: '', line: '', imageUrl: null }],
                },
              })
            }
          >
            <Plus size={14} aria-hidden />
            {t('proposals.editor.addCase')}
          </Button>
        </div>
      )
    case 'project_scope':
      return (
        <div className="grid min-w-0 gap-2">
          <SectionSurfaceControl
            value={block.props.sectionSurface ?? 'deck'}
            onChange={(sectionSurface) =>
              onChange({ ...block, props: { ...block.props, sectionSurface } })
            }
          />
          <ProjectScopeBlockEditor block={block} onChange={onChange} field={field} />
        </div>
      )
    case 'pricing':
      return (
        <div className="grid min-w-0 gap-2">
          <SectionSurfaceControl
            value={block.props.sectionSurface ?? 'deck'}
            onChange={(sectionSurface) =>
              onChange({ ...block, props: { ...block.props, sectionSurface } })
            }
          />
          <div className="grid min-w-0 gap-2">
          <input
            className={field}
            value={block.props.title}
            onChange={(e) =>
              onChange({ ...block, props: { ...block.props, title: e.target.value } })
            }
            placeholder={t('proposals.fields.sectionTitle')}
          />
          <SortableFieldRows
            blockId={`${block.id}::rows`}
            itemIds={block.props.rows.map((_, i) => String(i))}
            listLabel={t('proposals.sortFieldsInBlock')}
            onReorder={(next) => {
              const rows = next.map((i) => block.props.rows[Number(i)])
              onChange({ ...block, props: { ...block.props, rows } })
            }}
          >
            {(idxStr, handle) => {
              const idx = Number(idxStr)
              const r = block.props.rows[idx]
              if (!r) return null
              return (
                <>
                  {handle}
                  <div className="grid min-w-0 flex-1 gap-1 md:grid-cols-3">
                    <input
                      className={field}
                      value={r.package}
                      onChange={(e) => {
                        const rows = [...block.props.rows]
                        rows[idx] = { ...rows[idx], package: e.target.value }
                        onChange({ ...block, props: { ...block.props, rows } })
                      }}
                      placeholder={t('proposals.fields.package')}
                    />
                    <input
                      className={field}
                      value={r.deliverables}
                      onChange={(e) => {
                        const rows = [...block.props.rows]
                        rows[idx] = { ...rows[idx], deliverables: e.target.value }
                        onChange({ ...block, props: { ...block.props, rows } })
                      }}
                      placeholder={t('proposals.fields.deliverables')}
                    />
                    <input
                      className={field}
                      value={r.price}
                      onChange={(e) => {
                        const rows = [...block.props.rows]
                        rows[idx] = { ...rows[idx], price: e.target.value }
                        onChange({ ...block, props: { ...block.props, rows } })
                      }}
                      placeholder={t('proposals.fields.price')}
                    />
                  </div>
                  {block.props.rows.length > 1 ? (
                    <button
                      type="button"
                      className="shrink-0 rounded p-1 text-muted hover:bg-destructive/10 hover:text-destructive"
                      aria-label={t('proposals.editor.removeItem')}
                      onClick={() => {
                        const rows = block.props.rows.filter((_, i) => i !== idx)
                        onChange({ ...block, props: { ...block.props, rows } })
                      }}
                    >
                      <Trash2 size={14} aria-hidden />
                    </button>
                  ) : null}
                </>
              )
            }}
          </SortableFieldRows>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-8 w-fit gap-1"
            onClick={() =>
              onChange({
                ...block,
                props: {
                  ...block.props,
                  rows: [...block.props.rows, { package: '', deliverables: '', price: '' }],
                },
              })
            }
          >
            <Plus size={14} aria-hidden />
            {t('proposals.editor.addPricingRow')}
          </Button>
        </div>
        </div>
      )
    case 'timeline':
      return (
        <div className="grid min-w-0 gap-2">
          <SectionSurfaceControl
            value={block.props.sectionSurface ?? 'deck'}
            onChange={(sectionSurface) =>
              onChange({ ...block, props: { ...block.props, sectionSurface } })
            }
          />
          <input
            className={field}
            value={block.props.title}
            onChange={(e) =>
              onChange({ ...block, props: { ...block.props, title: e.target.value } })
            }
            placeholder={t('proposals.fields.sectionTitle')}
          />
          <SortableFieldRows
            blockId={`${block.id}::milestones`}
            itemIds={block.props.milestones.map((_, i) => String(i))}
            listLabel={t('proposals.sortFieldsInBlock')}
            onReorder={(next) => {
              const milestones = next.map((i) => block.props.milestones[Number(i)])
              onChange({ ...block, props: { ...block.props, milestones } })
            }}
          >
            {(idxStr, handle) => {
              const idx = Number(idxStr)
              const m = block.props.milestones[idx]
              if (!m) return null
              return (
                <>
                  {handle}
                  <div className="flex min-w-0 flex-1 gap-2">
                    <input
                      className={cn(field, 'w-28 shrink-0')}
                      value={m.week}
                      onChange={(e) => {
                        const milestones = [...block.props.milestones]
                        milestones[idx] = { ...milestones[idx], week: e.target.value }
                        onChange({ ...block, props: { ...block.props, milestones } })
                      }}
                      placeholder={t('proposals.fields.week')}
                    />
                    <input
                      className={cn(field, 'min-w-0 flex-1')}
                      value={m.label}
                      onChange={(e) => {
                        const milestones = [...block.props.milestones]
                        milestones[idx] = { ...milestones[idx], label: e.target.value }
                        onChange({ ...block, props: { ...block.props, milestones } })
                      }}
                      placeholder={t('proposals.fields.milestoneLabel')}
                    />
                  </div>
                  {block.props.milestones.length > 1 ? (
                    <button
                      type="button"
                      className="shrink-0 rounded p-1 text-muted hover:bg-destructive/10 hover:text-destructive"
                      aria-label={t('proposals.editor.removeItem')}
                      onClick={() => {
                        const milestones = block.props.milestones.filter((_, i) => i !== idx)
                        onChange({ ...block, props: { ...block.props, milestones } })
                      }}
                    >
                      <Trash2 size={14} aria-hidden />
                    </button>
                  ) : null}
                </>
              )
            }}
          </SortableFieldRows>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-8 w-fit gap-1"
            onClick={() =>
              onChange({
                ...block,
                props: {
                  ...block.props,
                  milestones: [...block.props.milestones, { week: '', label: '' }],
                },
              })
            }
          >
            <Plus size={14} aria-hidden />
            {t('proposals.editor.addMilestone')}
          </Button>
        </div>
      )
    case 'terms':
      return (
        <div className="grid min-w-0 gap-2">
          <SectionSurfaceControl
            value={block.props.sectionSurface ?? 'deck'}
            onChange={(sectionSurface) =>
              onChange({ ...block, props: { ...block.props, sectionSurface } })
            }
          />
          <textarea
            className={cn(field, 'block min-h-[140px] w-full min-w-0')}
            value={block.props.body}
            onChange={(e) =>
              onChange({ ...block, props: { ...block.props, body: e.target.value } })
            }
            placeholder={t('proposals.fields.termsBody')}
          />
        </div>
      )
    case 'service_matrix': {
      const { columnLabels, rows } = block.props
      const colCount = columnLabels.length

      const syncIncluded = (included: boolean[], count: number) => {
        const next = included.slice(0, count)
        while (next.length < count) next.push(false)
        return next
      }

      const patchMatrix = (next: typeof block.props) => onChange({ ...block, props: next })

      const addColumn = () => {
        patchMatrix({
          ...block.props,
          columnLabels: [...columnLabels, ''],
          rows: rows.map((r) => ({
            ...r,
            included: [...syncIncluded(r.included, colCount), false],
          })),
        })
      }

      const removeColumn = (idx: number) => {
        if (columnLabels.length <= 1) return
        patchMatrix({
          ...block.props,
          columnLabels: columnLabels.filter((_, i) => i !== idx),
          rows: rows.map((r) => ({
            ...r,
            included: r.included.filter((_, i) => i !== idx),
          })),
        })
      }

      const setColumnLabel = (idx: number, value: string) => {
        const nextLabels = [...columnLabels]
        nextLabels[idx] = value
        patchMatrix({ ...block.props, columnLabels: nextLabels })
      }

      const addRow = () => {
        patchMatrix({
          ...block.props,
          rows: [
            ...rows,
            {
              id: globalThis.crypto.randomUUID(),
              label: '',
              included: Array(colCount).fill(false) as boolean[],
            },
          ],
        })
      }

      const removeRow = (rowId: string) => {
        if (rows.length <= 1) return
        patchMatrix({
          ...block.props,
          rows: rows.filter((r) => r.id !== rowId),
        })
      }

      const setRowLabel = (rowId: string, label: string) => {
        patchMatrix({
          ...block.props,
          rows: rows.map((r) => (r.id === rowId ? { ...r, label } : r)),
        })
      }

      const toggleCell = (rowId: string, cellIdx: number) => {
        patchMatrix({
          ...block.props,
          rows: rows.map((r) => {
            if (r.id !== rowId) return r
            const inc = [...syncIncluded(r.included, colCount)]
            inc[cellIdx] = !inc[cellIdx]
            return { ...r, included: inc }
          }),
        })
      }

      return (
        <div className="grid min-w-0 gap-3">
          <input
            className={field}
            value={block.props.title}
            onChange={(e) =>
              patchMatrix({ ...block.props, title: e.target.value })
            }
            placeholder={t('proposals.fields.sectionTitle')}
          />

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted">{t('proposals.serviceMatrix.columns')}</span>
            <Button type="button" size="sm" variant="secondary" className="h-8 gap-1 px-2" onClick={addColumn}>
              <Plus size={14} aria-hidden />
              {t('proposals.serviceMatrix.addColumn')}
            </Button>
          </div>

          <div className="overflow-x-auto rounded border border-border/80">
            <table className="w-full min-w-[320px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="px-2 py-2 text-left text-xs font-medium text-muted">
                    {t('proposals.serviceMatrix.service')}
                  </th>
                  {columnLabels.map((lab, ci) => (
                    <th key={`col-${ci}`} className="min-w-[72px] px-1 py-2">
                      <div className="flex flex-col gap-1">
                        <input
                          className={cn(field, 'text-center text-xs')}
                          value={lab}
                          onChange={(e) => setColumnLabel(ci, e.target.value)}
                          placeholder={t('proposals.serviceMatrix.columnPlaceholder')}
                        />
                        {columnLabels.length > 1 ? (
                          <button
                            type="button"
                            className="text-[10px] text-destructive hover:underline"
                            onClick={() => removeColumn(ci)}
                          >
                            {t('proposals.serviceMatrix.removeColumn')}
                          </button>
                        ) : null}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/60 last:border-b-0">
                    <td className="px-2 py-1 align-middle">
                      <div className="flex items-center gap-1">
                        <input
                          className={cn(field, 'min-w-0 flex-1')}
                          value={row.label}
                          onChange={(e) => setRowLabel(row.id, e.target.value)}
                          placeholder={t('proposals.serviceMatrix.rowLabel')}
                        />
                        {rows.length > 1 ? (
                          <button
                            type="button"
                            className="shrink-0 rounded p-1 text-muted hover:bg-destructive/10 hover:text-destructive"
                            aria-label={t('proposals.serviceMatrix.removeRow')}
                            onClick={() => removeRow(row.id)}
                          >
                            <Trash2 size={14} aria-hidden />
                          </button>
                        ) : null}
                      </div>
                    </td>
                    {columnLabels.map((_, ci) => (
                      <td key={`${row.id}-${ci}`} className="px-1 py-1 text-center align-middle">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-input accent-primary"
                          checked={Boolean(row.included[ci])}
                          onChange={() => toggleCell(row.id, ci)}
                          aria-label={t('proposals.serviceMatrix.toggleIncluded')}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button type="button" size="sm" variant="secondary" className="h-8 w-fit gap-1" onClick={addRow}>
            <Plus size={14} aria-hidden />
            {t('proposals.serviceMatrix.addRow')}
          </Button>
        </div>
      )
    }
    case 'video': {
      const uploadVideo = async (file: File) => {
        if (!proposalId) {
          toast(t('proposals.visualGrid.saveProposalFirst'), 'error')
          return
        }
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch(
          `/api/prospects/${prospectId}/proposals/${proposalId}/upload-video`,
          { method: 'POST', body: fd, credentials: 'include' },
        )
        if (!res.ok) {
          toast(t('error.somethingWentWrong'), 'error')
          return
        }
        const data = (await res.json()) as { url?: string; path?: string }
        if (data.url && data.path) {
          onChange({
            ...block,
            props: {
              source: 'upload',
              title: block.props.title ?? '',
              filePath: data.path,
              fileUrl: data.url,
            },
          })
        }
      }

      return (
        <div className="grid min-w-0 gap-3">
          <input
            className={field}
            value={block.props.title ?? ''}
            onChange={(e) => {
              const title = e.target.value
              const p = block.props
              if (p.source === 'embed') {
                onChange({
                  ...block,
                  props: { source: 'embed', embedUrl: p.embedUrl, title },
                })
              } else if (p.source === 'upload') {
                onChange({
                  ...block,
                  props: {
                    source: 'upload',
                    filePath: p.filePath,
                    fileUrl: p.fileUrl,
                    title,
                  },
                })
              } else {
                onChange({
                  ...block,
                  props: { source: 'url', fileUrl: p.fileUrl, title },
                })
              }
            }}
            placeholder={t('proposals.video.titleOptional')}
          />

          <div className="flex flex-wrap gap-2" role="group" aria-label={t('proposals.video.sourceGroup')}>
            <Button
              type="button"
              size="sm"
              variant={block.props.source === 'embed' ? 'primary' : 'secondary'}
              className="h-8"
              onClick={() =>
                onChange({
                  ...block,
                  props: { source: 'embed', title: block.props.title ?? '', embedUrl: '' },
                })
              }
            >
              {t('proposals.video.embed')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={block.props.source === 'upload' ? 'primary' : 'secondary'}
              className="h-8"
              onClick={() =>
                onChange({
                  ...block,
                  props: {
                    source: 'upload',
                    title: block.props.title ?? '',
                    filePath: '',
                    fileUrl: '',
                  },
                })
              }
            >
              {t('proposals.video.upload')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={block.props.source === 'url' ? 'primary' : 'secondary'}
              className="h-8"
              onClick={() =>
                onChange({
                  ...block,
                  props: { source: 'url', title: block.props.title ?? '', fileUrl: '' },
                })
              }
            >
              {t('proposals.video.url')}
            </Button>
          </div>

          {block.props.source === 'embed' ? (
            <input
              className={field}
              value={block.props.embedUrl}
              onChange={(e) =>
                onChange({
                  ...block,
                  props: {
                    source: 'embed',
                    title: block.props.title ?? '',
                    embedUrl: e.target.value,
                  },
                })
              }
              placeholder={t('proposals.video.embedPlaceholder')}
            />
          ) : null}

          {block.props.source === 'url' ? (
            <input
              className={field}
              value={block.props.fileUrl}
              onChange={(e) =>
                onChange({
                  ...block,
                  props: {
                    source: 'url',
                    title: block.props.title ?? '',
                    fileUrl: e.target.value,
                  },
                })
              }
              placeholder={t('proposals.video.urlPlaceholder')}
            />
          ) : null}

          {block.props.source === 'upload' ? (
            <div className="grid gap-2">
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                className={cn(field, 'cursor-pointer text-xs file:mr-2')}
                disabled={!proposalId}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  e.target.value = ''
                  if (f) void uploadVideo(f)
                }}
              />
              {block.props.fileUrl ? (
                <p className="truncate text-xs text-muted">{block.props.fileUrl}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      )
    }
    case 'image_comparison':
      return (
        <ImageComparisonBlockFields
          block={block}
          onChange={onChange}
          prospectId={prospectId}
          proposalId={proposalId}
        />
      )
    case 'visual_grid':
      return (
        <VisualGridBlockEditor
          block={block}
          onChange={onChange}
          prospectId={prospectId}
          proposalId={proposalId}
        />
      )
  }
}

const BLOCK_TYPES: ProposalBlockType[] = [
  'cover',
  'service_tags',
  'about_2mb',
  'why_us',
  'comparable_cases',
  'image_comparison',
  'project_scope',
  'service_matrix',
  'visual_grid',
  'pricing',
  'timeline',
  'testimonials',
  'terms',
  'video',
]

export function ProposalWorkspace({
  prospectId,
  initialProposalId = null,
  initialProjectId = null,
  documentKind = 'proposal',
}: {
  prospectId: string
  initialProposalId?: string | null
  initialProjectId?: string | null
  documentKind?: DocumentKind
}) {
  const { t } = useTranslation()
  const copyNs = documentKind === 'offer' ? 'offers' : 'proposals'
  const listUrl = `/api/prospects/${prospectId}/proposals?kind=${documentKind}`
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<{ proposal: ProposalDto; mergedBlocks: ProposalBlock[] | null }[]>(
    [],
  )
  const [proposalId, setProposalId] = useState<string | null>(initialProposalId)
  const [proposalMeta, setProposalMeta] = useState<ProposalDto | null>(null)
  const [blocks, setBlocks] = useState<ProposalBlock[]>([])
  const [mergePackage, setMergePackage] = useState<MergePackage | null>(null)
  const [studioDefaults, setStudioDefaults] = useState<StudioProposalDefaults | null>(null)
  const [sharePath, setSharePath] = useState<string | null>(null)
  const [advanceStage, setAdvanceStage] = useState(false)
  const [busy, setBusy] = useState(false)

  const [editingProposalId, setEditingProposalId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<ProposalDto | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [menuBusyId, setMenuBusyId] = useState<string | null>(null)

  const [newTitle, setNewTitle] = useState('')
  const [newPreset, setNewPreset] = useState<ProposalPresetId>('developer')
  const [newTemplateId, setNewTemplateId] = useState<string>('')
  const [blockPick, setBlockPick] = useState<ProposalBlockType>('why_us')
  const [accountName, setAccountName] = useState<string | null>(null)
  const [offerProjectId, setOfferProjectId] = useState<string | null>(initialProjectId)

  useEffect(() => {
    if (initialProjectId) setOfferProjectId(initialProjectId)
  }, [initialProjectId])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const { data: studioSettingsRow } = useQuery({
    queryKey: STUDIO_SETTINGS_QUERY_KEY,
    queryFn: ({ signal }) => fetchStudioSettings(signal),
    staleTime: 60_000,
  })

  const studioTemplates = useMemo(
    () => studioTemplatesFromGeneral(studioSettingsRow?.general, documentKind),
    [studioSettingsRow?.general, documentKind],
  )

  useEffect(() => {
    const defaultId = defaultStudioTemplateId(studioSettingsRow?.general, documentKind)
    if (defaultId) setNewTemplateId(defaultId)
  }, [studioSettingsRow?.general, documentKind])

  const mergedPreview = useMemo(() => {
    let out = mergePackage ? applyMergeToBlocks(blocks, mergePackage) : blocks
    if (studioDefaults) {
      out = applyStudioDefaultsToBlocks(out, studioDefaults)
    }
    return out
  }, [blocks, mergePackage, studioDefaults])

  const reloadList = useCallback(async () => {
    const res = await fetch(listUrl, {
      credentials: 'include',
      cache: 'no-store',
    })
    if (!res.ok) {
      setItems([])
      return
    }
    const data = (await res.json()) as {
      items: { proposal: ProposalDto; mergedBlocks: ProposalBlock[] | null }[]
    }
    setItems(data.items ?? [])
  }, [listUrl])

  const loadProposal = useCallback(
    async (pid: string) => {
      const res = await fetch(`/api/prospects/${prospectId}/proposals/${pid}`, {
        credentials: 'include',
        cache: 'no-store',
      })
      if (!res.ok) return
      const data = (await res.json()) as {
        proposal: ProposalDto
        mergedBlocks: ProposalBlock[] | null
        mergePackage: MergePackage | null
        studioDefaults: StudioProposalDefaults | null
        share: { publicPath: string } | null
      }
      setProposalMeta(data.proposal)
      setProposalId(data.proposal.id)
      setBlocks(parseProposalBlocks(data.proposal.blocks))
      setMergePackage(data.mergePackage)
      setStudioDefaults(data.studioDefaults)
      setSharePath(data.share?.publicPath ?? null)
    },
    [prospectId],
  )

  useEffect(() => {
    setProposalId(null)
    setProposalMeta(null)
    setBlocks([])
    setMergePackage(null)
    setStudioDefaults(null)
    setSharePath(null)
    setItems([])
    setEditingProposalId(null)
    setDeleteTarget(null)
    setAccountName(null)
    setNewTitle('')
  }, [prospectId])

  useEffect(() => {
    let cancelled = false
    void fetch(`/api/prospects/${prospectId}`, { credentials: 'include', cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { prospect?: { account?: { name?: string } } } | null) => {
        if (cancelled) return
        const name = data?.prospect?.account?.name?.trim()
        if (!name) return
        setAccountName(name)
        setNewTitle((prev) => prev || t('proposals.defaultTitleFor', { company: name }))
      })
    return () => {
      cancelled = true
    }
  }, [prospectId, t])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      await reloadList()
      if (cancelled) return
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [prospectId, reloadList])

  useEffect(() => {
    if (initialProposalId) {
      setProposalId(initialProposalId)
    }
  }, [initialProposalId])

  useEffect(() => {
    if (proposalId && items.some((row) => row.proposal.id === proposalId)) {
      void loadProposal(proposalId)
      return
    }
    if (!proposalId && items.length > 0) {
      void loadProposal(items[0].proposal.id)
    }
  }, [items, proposalId, loadProposal])

  useEffect(() => {
    if (!editingProposalId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEditingProposalId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editingProposalId])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = blocks.findIndex((b) => b.id === active.id)
    const newIndex = blocks.findIndex((b) => b.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    setBlocks(arrayMove(blocks, oldIndex, newIndex))
  }

  const patchBlock = (idx: number, next: ProposalBlock) => {
    setBlocks((prev) => prev.map((b, i) => (i === idx ? next : b)))
  }

  const removeBlock = (idx: number) => {
    setBlocks((prev) => prev.filter((_, i) => i !== idx))
  }

  const addBlock = (type: ProposalBlockType) => {
    setBlocks((prev) => [...prev, createEmptyBlock(type)])
  }

  async function saveDraft() {
    if (!proposalId || !proposalMeta) return
    setBusy(true)
    try {
      const res = await fetch(`/api/prospects/${prospectId}/proposals/${proposalId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: proposalMeta.title,
          blocks,
          language: proposalMeta.language,
        }),
      })
      if (!res.ok) {
        toast(t('error.somethingWentWrong'), 'error')
        return
      }
      await reloadList()
      await loadProposal(proposalId)
      toast(t('proposals.savedDraft'))
    } finally {
      setBusy(false)
    }
  }

  async function publish() {
    if (!proposalId) return
    setBusy(true)
    try {
      const res = await fetch(`/api/prospects/${prospectId}/proposals/${proposalId}/publish`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ advanceStage }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast(json.message ?? t('error.somethingWentWrong'), 'error')
        return
      }
      const share = json.share as { publicPath?: string } | undefined
      if (share?.publicPath) setSharePath(share.publicPath)
      await reloadList()
      await loadProposal(proposalId)
      toast(t('proposals.published'))
    } finally {
      setBusy(false)
    }
  }

  async function createProposal() {
    if (documentKind === 'offer' && !offerProjectId) {
      toast(t('clientProjects.createProjectFirst'), 'error')
      return
    }
    setBusy(true)
    try {
      const payload: Record<string, unknown> = {
        title: newTitle.trim() || t(`${copyNs}.defaultTitle`),
        documentKind,
      }
      if (documentKind === 'offer' && offerProjectId) {
        payload.projectId = offerProjectId
      }
      if (studioTemplates.length > 0 && newTemplateId) {
        payload.templateId = newTemplateId
      } else if (documentKind === 'proposal') {
        payload.preset = newPreset
      }

      const res = await fetch(`/api/prospects/${prospectId}/proposals`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string }
        if (payload.error === 'project_required') {
          toast(t('clientProjects.createProjectFirst'), 'error')
        } else {
          toast(payload.error === 'create_failed' ? t(`${copyNs}.createFailed`) : t('error.somethingWentWrong'), 'error')
        }
        return
      }
      const data = (await res.json()) as {
        proposal: ProposalDto
        mergePackage: MergePackage | null
        studioDefaults: StudioProposalDefaults | null
      }
      await reloadList()
      if (data.mergePackage) {
        setProposalMeta(data.proposal)
        setProposalId(data.proposal.id)
        setBlocks(parseProposalBlocks(data.proposal.blocks))
        setMergePackage(data.mergePackage)
        setStudioDefaults(data.studioDefaults)
        setSharePath(null)
      } else {
        await loadProposal(data.proposal.id)
      }
      toast(t(`${copyNs}.created`))
    } finally {
      setBusy(false)
    }
  }

  async function commitRename(proposalIdToRename: string) {
    const trimmed = editingTitle.trim()
    if (!trimmed) {
      toast(t('proposals.renameEmpty'), 'error')
      return
    }
    setBusy(true)
    try {
      const res = await fetch(`/api/prospects/${prospectId}/proposals/${proposalIdToRename}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      })
      if (!res.ok) {
        toast(t('error.somethingWentWrong'), 'error')
        return
      }
      setEditingProposalId(null)
      await reloadList()
      setProposalMeta((m) => (m?.id === proposalIdToRename ? { ...m, title: trimmed } : m))
      toast(t('proposals.renamed'))
    } finally {
      setBusy(false)
    }
  }

  async function deleteProposalConfirmed() {
    if (!deleteTarget) return
    setDeleteBusy(true)
    try {
      const res = await fetch(`/api/prospects/${prospectId}/proposals/${deleteTarget.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        toast(t('error.somethingWentWrong'), 'error')
        return
      }
      const removedId = deleteTarget.id
      setDeleteTarget(null)
      if (proposalId === removedId) {
        setProposalId(null)
        setProposalMeta(null)
        setBlocks([])
        setMergePackage(null)
        setSharePath(null)
      }
      await reloadList()
      toast(t('proposals.deleted'))
    } finally {
      setDeleteBusy(false)
    }
  }

  function downloadPdf(source: 'published' | 'draft') {
    if (!proposalId) return
    openProposalPdf(prospectId, proposalId, source)
  }

  function printDocument() {
    if (!proposalId || !proposalMeta) return
    openProposalPdf(
      prospectId,
      proposalId,
      proposalMeta.status === 'published' ? 'published' : 'draft',
    )
  }

  async function sendToClient() {
    if (!proposalId) return
    setBusy(true)
    try {
      let path = sharePath
      if (proposalMeta?.status !== 'published') {
        const { sharePublicPath } = await publishProposal(prospectId, proposalId, advanceStage)
        path = sharePublicPath
      } else if (!path) {
        path = await fetchProposalSharePath(prospectId, proposalId)
      }
      if (!path) {
        toast(t('proposals.shareLinkUnavailable'), 'error')
        return
      }
      const url = `${origin}${path}`
      await navigator.clipboard.writeText(url)
      setSharePath(path)
      await reloadList()
      await loadProposal(proposalId)
      toast(t('proposals.linkCopied'))
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('proposals.publishFailed')
      toast(msg, 'error')
    } finally {
      setBusy(false)
    }
  }

  const runMenuAction = useCallback(async (id: string, fn: () => Promise<void>) => {
    setMenuBusyId(id)
    try {
      await fn()
    } finally {
      setMenuBusyId(null)
    }
  }, [])

  const proposalListMenuHandlers = useMemo<ProposalListMenuHandlers>(
    () => ({
      onOpen: (item) => {
        void loadProposal(item.id)
      },
      onRename: (item) => {
        setEditingProposalId(item.id)
        setEditingTitle(item.title)
      },
      onPublish: (item) => {
        void runMenuAction(item.id, async () => {
          try {
            const { sharePublicPath } = await publishProposal(prospectId, item.id, false)
            if (item.id === proposalId && sharePublicPath) setSharePath(sharePublicPath)
            await reloadList()
            if (proposalId === item.id) await loadProposal(item.id)
            toast(t('proposals.published'))
          } catch (e) {
            const msg = e instanceof Error ? e.message : t('proposals.publishFailed')
            toast(msg, 'error')
          }
        })
      },
      onUnpublish: (item) => {
        void runMenuAction(item.id, async () => {
          try {
            await unpublishProposal(prospectId, item.id)
            if (item.id === proposalId) setSharePath(null)
            await reloadList()
            if (proposalId === item.id) await loadProposal(item.id)
            toast(t('proposals.unpublished'))
          } catch {
            toast(t('proposals.unpublishFailed'), 'error')
          }
        })
      },
      onCopyLink: (item) => {
        void runMenuAction(item.id, async () => {
          try {
            const url = await copyProposalShareLink(prospectId, item.id)
            if (!url) {
              toast(t('proposals.shareLinkUnavailable'), 'error')
              return
            }
            toast(t('proposals.linkCopied'))
          } catch {
            toast(t('proposals.shareLinkUnavailable'), 'error')
          }
        })
      },
      onOpenClientPage: (item) => {
        void runMenuAction(item.id, async () => {
          const path = await fetchProposalSharePath(prospectId, item.id)
          if (!path) {
            toast(t('proposals.shareLinkUnavailable'), 'error')
            return
          }
          window.open(`${window.location.origin}${path}`, '_blank', 'noopener,noreferrer')
        })
      },
      onDelete: (item) => {
        const target = items.find((row) => row.proposal.id === item.id)?.proposal
        if (target) setDeleteTarget(target)
      },
      isBusy: (id) => menuBusyId === id || deleteBusy || busy,
    }),
    [
      busy,
      deleteBusy,
      items,
      loadProposal,
      menuBusyId,
      proposalId,
      prospectId,
      reloadList,
      runMenuAction,
      t,
    ],
  )

  const origin =
    typeof window !== 'undefined' ? `${window.location.origin}` : ''

  return (
    <Container className="py-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link
          href={`/prospects/${prospectId}`}
          className="survey-brand-button inline-flex h-8 max-w-full items-center justify-center gap-1.5 px-3 text-xs font-medium text-foreground transition-colors hover:bg-hover active:bg-primary/10"
          title={
            accountName
              ? t('proposals.backToCompany', { name: accountName })
              : t('proposals.backToProspect')
          }
        >
          <ArrowLeft size={16} className="shrink-0" />
          <span className="truncate">
            {accountName
              ? t('proposals.backToCompany', { name: truncateLabel(accountName) })
              : t('proposals.backToProspect')}
          </span>
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <div className={cn(studioTintPanel, 'space-y-3')}>
            <h2 className="text-sm font-semibold text-foreground">{t(`${copyNs}.createTitle`)}</h2>
            <p className="text-xs text-muted">{t(`${copyNs}.studioTemplateHint`)}</p>
            <div className={cn('grid min-w-0 gap-2', 'md:grid-cols-2')}>
              <input
                className="w-full min-w-0 rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus-visible:ring-1 focus-visible:ring-primary"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={t(`${copyNs}.defaultTitle`)}
                aria-label={t(`${copyNs}.proposalTitle`)}
              />
              {studioTemplates.length > 0 ? (
                <select
                  className="w-full min-w-0 rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  value={newTemplateId}
                  onChange={(e) => setNewTemplateId(e.target.value)}
                  aria-label={t('proposals.studioTemplate')}
                >
                  {studioTemplates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name}
                      {tpl.isDefault ? ` (${t('proposals.studioTemplateDefault')})` : ''}
                    </option>
                  ))}
                </select>
              ) : documentKind === 'proposal' ? (
                <select
                  className="w-full min-w-0 rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  value={newPreset}
                  onChange={(e) => setNewPreset(e.target.value as ProposalPresetId)}
                >
                  <option value="developer">{t('proposals.presets.developer')}</option>
                  <option value="architect">{t('proposals.presets.architect')}</option>
                  <option value="custom">{t('proposals.presets.custom')}</option>
                </select>
              ) : (
                <p className="text-xs text-muted">{t('offers.createFromTemplateHint')}</p>
              )}
            </div>
            <Button
              type="button"
              size="sm"
              disabled={busy || (studioTemplates.length > 0 && !newTemplateId)}
              onClick={() => void createProposal()}
            >
              <Plus size={14} />
              {studioTemplates.length > 0
                ? t(`${copyNs}.createFromStudio`)
                : t('common.create')}
            </Button>
          </div>

          <div className={studioBlockStack}>
            <div>
              <h2 className={studioSectionTitleClass}>{t(`${copyNs}.yourProposals`)}</h2>
              <p className="mt-1 text-sm text-muted">{t(`${copyNs}.yourProposalsHint`)}</p>
            </div>
            {loading ? (
              <p className="text-sm text-muted">{t('common.loading')}</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted">{t(`${copyNs}.empty`)}</p>
            ) : (
              <ul className={studioSortableStack} role="list">
                {items.map((it) => {
                  const selected = proposalId === it.proposal.id
                  const editing = editingProposalId === it.proposal.id
                  const statusVariant =
                    it.proposal.status === 'published' ? 'success' : 'default'
                  return (
                    <li key={it.proposal.id}>
                      <div
                        className={cn(
                          studioMemberRow,
                          'gap-2 px-2.5 py-2 sm:px-3 sm:py-2.5',
                          selected && studioMemberRowSelected,
                        )}
                      >
                        {editing ? (
                          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                            <input
                              className={cn(proposalFieldClass, 'min-w-0 flex-1 bg-background font-medium')}
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  void commitRename(it.proposal.id)
                                }
                              }}
                              aria-label={t('proposals.rename')}
                              autoFocus
                            />
                            <Button
                              type="button"
                              size="sm"
                              disabled={busy}
                              onClick={() => void commitRename(it.proposal.id)}
                            >
                              {t('common.save')}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={busy}
                              onClick={() => setEditingProposalId(null)}
                            >
                              {t('common.cancel')}
                            </Button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="min-w-0 flex-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            onClick={() => void loadProposal(it.proposal.id)}
                          >
                            <span className="block truncate text-sm font-medium text-foreground">
                              {it.proposal.title}
                            </span>
                            <span className="mt-1 flex flex-wrap items-center gap-2">
                              <span className="text-xs tabular-nums text-muted">
                                v{it.proposal.version}
                              </span>
                              <Badge variant={statusVariant} size="sm">
                                {t(`proposals.status.${it.proposal.status}`)}
                              </Badge>
                            </span>
                          </button>
                        )}
                        {!editing ? (
                          <div
                            className="flex shrink-0 items-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenu
                              align="right"
                              items={buildProposalListMenuItems(
                                t,
                                prospectId,
                                {
                                  id: it.proposal.id,
                                  title: it.proposal.title,
                                  status: it.proposal.status,
                                },
                                proposalListMenuHandlers,
                              )}
                              trigger={
                                <IconButton
                                  icon={MoreVertical}
                                  variant="ghost"
                                  size="sm"
                                  label={t('proposals.actions')}
                                  disabled={proposalListMenuHandlers.isBusy(it.proposal.id)}
                                />
                              }
                            />
                          </div>
                        ) : null}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {proposalMeta && (
            <div className="space-y-3">
              <input
                className="w-full min-w-0 rounded-md border border-input bg-transparent px-2 py-1.5 text-base font-medium outline-none"
                value={proposalMeta.title}
                onChange={(e) => setProposalMeta({ ...proposalMeta, title: e.target.value })}
              />
              <div className="flex flex-wrap gap-2">
                <select
                  className="rounded-md border border-input bg-transparent px-2 py-1.5 text-sm"
                  value={proposalMeta.language}
                  onChange={(e) =>
                    setProposalMeta({
                      ...proposalMeta,
                      language: e.target.value as 'de' | 'en',
                    })
                  }
                >
                  <option value="en">EN</option>
                  <option value="de">DE</option>
                </select>
                <Button type="button" size="sm" disabled={busy} onClick={() => void saveDraft()}>
                  {t('proposals.saveDraft')}
                </Button>
                <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => publish()}>
                  {t('proposals.publish')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => void sendToClient()}
                >
                  <Send size={14} />
                  {t('proposals.sendToClient')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => downloadPdf(proposalMeta.status === 'published' ? 'published' : 'draft')}
                >
                  <Download size={14} />
                  {proposalMeta.status === 'published'
                    ? t('proposals.downloadPdfPublished')
                    : t('proposals.downloadPdfDraft')}
                </Button>
                <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={printDocument}>
                  <Printer size={14} />
                  {t('proposals.print')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={busy || proposalMeta.status !== 'published' || !proposalId}
                  onClick={() => {
                    if (!proposalId) return
                    void runMenuAction(proposalId, async () => {
                      const url = await copyProposalShareLink(prospectId, proposalId)
                      if (!url) {
                        toast(t('proposals.shareLinkUnavailable'), 'error')
                        return
                      }
                      toast(t('proposals.linkCopied'))
                    })
                  }}
                >
                  <Copy size={14} />
                  {t('proposals.copyLink')}
                </Button>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={advanceStage}
                  onChange={(e) => setAdvanceStage(e.target.checked)}
                />
                {t('proposals.publishAdvanceStage')}
              </label>
              {sharePath ? (
                <div className="rounded-md border border-border p-3 text-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    {t('proposals.publicLink')}
                  </p>
                  <p className="mt-1 break-all font-mono text-xs">
                    {origin}
                    {sharePath}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      void navigator.clipboard.writeText(`${origin}${sharePath}`)
                      toast(t('proposals.linkCopied'))
                    }}
                  >
                    {t('proposals.copyLink')}
                  </Button>
                </div>
              ) : null}
            </div>
          )}

          {proposalId && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted">
                  {t('proposals.addBlock')}
                </span>
                <select
                  className={blockTypePickerSelectClass}
                  value={blockPick}
                  onChange={(e) => setBlockPick(e.target.value as ProposalBlockType)}
                >
                  {BLOCK_TYPES.map((bt) => (
                    <option key={bt} value={bt}>
                      {t(`proposals.blockTypes.${bt}`)}
                    </option>
                  ))}
                </select>
                <Button type="button" size="sm" variant="secondary" onClick={() => addBlock(blockPick)}>
                  <Plus size={14} />
                  {t('common.add')}
                </Button>
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {blocks.map((block, idx) => (
                      <SortableBlockRow
                        key={block.id}
                        block={block}
                        onRemove={() => removeBlock(idx)}
                      >
                        <BlockFields
                          block={block}
                          prospectId={prospectId}
                          proposalId={proposalId}
                          proposalLanguage={proposalMeta?.language ?? 'en'}
                          onChange={(next) => patchBlock(idx, next)}
                        />
                      </SortableBlockRow>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>

        <div className="min-w-0 lg:sticky lg:top-6 lg:z-10 lg:self-start">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">
            {t('proposals.preview')}
          </p>
          <p className="mb-3 text-xs text-muted">{t('proposals.builderHint')}</p>
          <div
            className="max-h-[min(80vh,calc(100vh-8rem))] min-w-0 overflow-y-auto rounded-md border border-[color:var(--deck-line,#333)] bg-[color:var(--deck-bg)] transition-colors duration-200"
            style={studioDefaults?.deckTheme ? deckCssVars(studioDefaults.deckTheme) : undefined}
          >
            <ProposalDeckPreview
              blocks={mergedPreview}
              language={proposalMeta?.language ?? 'en'}
              themeOverride={studioDefaults?.deckTheme}
              studioLogoOverride={studioDefaults?.studioLogoUrl}
              deckFontsOverride={studioDefaults?.deckFonts}
              brandKitConfigured={Boolean(studioDefaults?.deckTheme)}
            />
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => {
          if (!deleteBusy) setDeleteTarget(null)
        }}
        onConfirm={() => void deleteProposalConfirmed()}
        title={t('proposals.deleteProposalTitle')}
        message={t('proposals.deleteProposalBody', { title: deleteTarget?.title ?? '' })}
        variant="destructive"
        loading={deleteBusy}
        confirmLabel={t('common.delete')}
      />
    </Container>
  )
}
