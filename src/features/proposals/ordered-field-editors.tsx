'use client'

import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/atoms'
import { SortableFieldRows } from '@/features/proposals/SortableFieldRows'
import { cn } from '@/lib/cn'
import type {
  AboutFieldId,
  CoverFieldId,
  ProjectScopeFieldId,
  ProposalBlock,
  WhyUsFieldId,
} from '@/lib/proposals/blockSchema'

type OnBlockChange = (next: ProposalBlock) => void

export function CoverBlockEditor({
  block,
  onChange,
  field,
}: {
  block: Extract<ProposalBlock, { type: 'cover' }>
  onChange: OnBlockChange
  field: string
}) {
  const { t } = useTranslation()
  const p = block.props
  return (
    <>
      <SortableFieldRows
        blockId={block.id}
        itemIds={[...p.fieldOrder]}
        listLabel={t('proposals.sortFieldsInBlock')}
        alignStart
        onReorder={(next) =>
          onChange({ ...block, props: { ...p, fieldOrder: next as CoverFieldId[] } })
        }
      >
      {(fieldId, handle) => (
        <>
          {handle}
          <div className="min-w-0 flex-1">
            {fieldId === 'dateLabel' ? (
              <input
                className={field}
                value={p.dateLabel ?? ''}
                onChange={(e) =>
                  onChange({ ...block, props: { ...p, dateLabel: e.target.value } })
                }
                placeholder={t('proposals.fields.dateLabel')}
              />
            ) : null}
            {fieldId === 'headline' ? (
              <input
                className={field}
                value={p.headline ?? ''}
                onChange={(e) =>
                  onChange({ ...block, props: { ...p, headline: e.target.value } })
                }
                placeholder={t('proposals.fields.headline')}
              />
            ) : null}
            {fieldId === 'subtitle' ? (
              <input
                className={field}
                value={p.subtitle ?? ''}
                onChange={(e) =>
                  onChange({ ...block, props: { ...p, subtitle: e.target.value } })
                }
                placeholder={t('proposals.fields.subtitle')}
              />
            ) : null}
            {fieldId === 'clientCompany' ? (
              <input
                className={field}
                value={p.clientCompany ?? ''}
                onChange={(e) =>
                  onChange({ ...block, props: { ...p, clientCompany: e.target.value } })
                }
                placeholder={t('proposals.fields.clientCompany')}
              />
            ) : null}
            {fieldId === 'contactName' ? (
              <input
                className={field}
                value={p.contactName ?? ''}
                onChange={(e) =>
                  onChange({ ...block, props: { ...p, contactName: e.target.value } })
                }
                placeholder={t('proposals.fields.contactName')}
              />
            ) : null}
            {fieldId === 'contactRole' ? (
              <input
                className={field}
                value={p.contactRole ?? ''}
                onChange={(e) =>
                  onChange({ ...block, props: { ...p, contactRole: e.target.value } })
                }
                placeholder={t('proposals.fields.contactRole')}
              />
            ) : null}
            {fieldId === 'contactEmail' ? (
              <input
                className={field}
                value={p.contactEmail ?? ''}
                onChange={(e) =>
                  onChange({ ...block, props: { ...p, contactEmail: e.target.value } })
                }
                placeholder={t('proposals.fields.contactEmail')}
              />
            ) : null}
            {fieldId === 'heroImageUrl' ? (
              <input
                className={field}
                value={p.heroImageUrl ?? ''}
                onChange={(e) =>
                  onChange({
                    ...block,
                    props: { ...p, heroImageUrl: e.target.value.trim() || null },
                  })
                }
                placeholder={t('proposals.fields.heroImageUrl')}
              />
            ) : null}
            {fieldId === 'clientLogoUrl' ? (
              <input
                className={field}
                value={p.clientLogoUrl ?? ''}
                onChange={(e) =>
                  onChange({
                    ...block,
                    props: { ...p, clientLogoUrl: e.target.value.trim() || null },
                  })
                }
                placeholder={t('proposals.fields.clientLogoUrl')}
              />
            ) : null}
          </div>
        </>
      )}
    </SortableFieldRows>
      <div className="mt-6 grid gap-3 border-t border-border pt-4">
        <p className="text-xs font-medium text-muted">{t('proposals.cover.letterheadSection')}</p>
        <label className="text-xs text-muted" htmlFor={`cover-sender-${block.id}`}>
          {t('proposals.cover.senderBlock')}
        </label>
        <textarea
          id={`cover-sender-${block.id}`}
          className={cn(field, 'min-h-[72px]')}
          value={p.senderBlock ?? ''}
          onChange={(e) =>
            onChange({ ...block, props: { ...p, senderBlock: e.target.value } })
          }
        />
        <label className="text-xs text-muted" htmlFor={`cover-recipient-${block.id}`}>
          {t('proposals.cover.recipientBlock')}
        </label>
        <textarea
          id={`cover-recipient-${block.id}`}
          className={cn(field, 'min-h-[72px]')}
          value={p.recipientBlock ?? ''}
          onChange={(e) =>
            onChange({ ...block, props: { ...p, recipientBlock: e.target.value } })
          }
        />
        <div className="grid gap-2 sm:grid-cols-3">
          <input
            className={field}
            value={p.documentKindLine ?? ''}
            onChange={(e) =>
              onChange({ ...block, props: { ...p, documentKindLine: e.target.value } })
            }
            placeholder={t('proposals.cover.documentKindLine')}
          />
          <input
            className={field}
            value={p.issuedLine ?? ''}
            onChange={(e) =>
              onChange({ ...block, props: { ...p, issuedLine: e.target.value } })
            }
            placeholder={t('proposals.cover.issuedLine')}
          />
          <input
            className={field}
            value={p.validLine ?? ''}
            onChange={(e) =>
              onChange({ ...block, props: { ...p, validLine: e.target.value } })
            }
            placeholder={t('proposals.cover.validLine')}
          />
        </div>
        <label className="flex flex-col gap-1 text-xs text-muted">
          {t('proposals.cover.letterheadSurface')}
          <select
            className={field}
            value={p.letterheadSurface ?? 'dark'}
            onChange={(e) =>
              onChange({
                ...block,
                props: {
                  ...p,
                  letterheadSurface: e.target.value === 'light' ? 'light' : 'dark',
                },
              })
            }
          >
            <option value="dark">{t('proposals.cover.surfaceDark')}</option>
            <option value="light">{t('proposals.cover.surfaceLight')}</option>
          </select>
        </label>
      </div>
    </>
  )
}

export function WhyUsBlockEditor({
  block,
  onChange,
  field,
}: {
  block: Extract<ProposalBlock, { type: 'why_us' }>
  onChange: OnBlockChange
  field: string
}) {
  const { t } = useTranslation()
  const p = block.props
  return (
    <SortableFieldRows
      blockId={block.id}
      itemIds={[...p.fieldOrder]}
      alignStart
      listLabel={t('proposals.sortFieldsInBlock')}
      onReorder={(next) =>
        onChange({ ...block, props: { ...p, fieldOrder: next as WhyUsFieldId[] } })
      }
    >
      {(fid, handle) => (
        <>
          {handle}
          <div className="min-w-0 flex-1">
            {fid === 'title' ? (
              <input
                className={field}
                value={p.title}
                onChange={(e) =>
                  onChange({ ...block, props: { ...p, title: e.target.value } })
                }
                placeholder={t('proposals.fields.sectionTitle')}
              />
            ) : (
              <textarea
                className={cn(field, 'min-h-[120px]')}
                value={p.bullets.join('\n')}
                onChange={(e) =>
                  onChange({
                    ...block,
                    props: {
                      ...p,
                      bullets: e.target.value.split('\n').filter(Boolean),
                    },
                  })
                }
                placeholder={t('proposals.fields.bulletsOnePerLine')}
              />
            )}
          </div>
        </>
      )}
    </SortableFieldRows>
  )
}

export function ProjectScopeBlockEditor({
  block,
  onChange,
  field,
}: {
  block: Extract<ProposalBlock, { type: 'project_scope' }>
  onChange: OnBlockChange
  field: string
}) {
  const { t } = useTranslation()
  const p = block.props
  return (
    <SortableFieldRows
      blockId={block.id}
      itemIds={[...p.fieldOrder]}
      alignStart
      listLabel={t('proposals.sortFieldsInBlock')}
      onReorder={(next) =>
        onChange({ ...block, props: { ...p, fieldOrder: next as ProjectScopeFieldId[] } })
      }
    >
      {(fid, handle) => (
        <>
          {handle}
          <div className="min-w-0 flex-1">
            {fid === 'title' ? (
              <input
                className={field}
                value={p.title}
                onChange={(e) =>
                  onChange({ ...block, props: { ...p, title: e.target.value } })
                }
                placeholder={t('proposals.fields.sectionTitle')}
              />
            ) : null}
            {fid === 'bullets' ? (
              <textarea
                className={cn(field, 'min-h-[100px]')}
                value={p.bullets.join('\n')}
                onChange={(e) =>
                  onChange({
                    ...block,
                    props: {
                      ...p,
                      bullets: e.target.value.split('\n').filter(Boolean),
                    },
                  })
                }
                placeholder={t('proposals.fields.bulletsOnePerLine')}
              />
            ) : null}
            {fid === 'imageUrl' ? (
              <input
                className={field}
                value={p.imageUrl ?? ''}
                onChange={(e) =>
                  onChange({
                    ...block,
                    props: { ...p, imageUrl: e.target.value.trim() || null },
                  })
                }
                placeholder={t('proposals.fields.scopeImageUrl')}
              />
            ) : null}
          </div>
        </>
      )}
    </SortableFieldRows>
  )
}

export function About2mbBlockEditor({
  block,
  onChange,
  field,
}: {
  block: Extract<ProposalBlock, { type: 'about_2mb' }>
  onChange: OnBlockChange
  field: string
}) {
  const { t } = useTranslation()
  const p = block.props
  const { kpis } = p

  const addKpi = () =>
    onChange({
      ...block,
      props: {
        ...p,
        kpis: [...kpis, { label: '', value: '' }],
      },
    })

  const removeKpi = (idx: number) => {
    if (kpis.length <= 1) return
    onChange({
      ...block,
      props: { ...p, kpis: kpis.filter((_, i) => i !== idx) },
    })
  }

  const patchKpi = (idx: number, patch: Partial<{ label: string; value: string }>) => {
    const next = kpis.map((k, i) => (i === idx ? { ...k, ...patch } : k))
    onChange({ ...block, props: { ...p, kpis: next } })
  }

  return (
    <SortableFieldRows
      blockId={block.id}
      itemIds={[...p.fieldOrder]}
      alignStart
      listLabel={t('proposals.sortFieldsInBlock')}
      onReorder={(next) =>
        onChange({ ...block, props: { ...p, fieldOrder: next as AboutFieldId[] } })
      }
    >
      {(fid, handle) => (
        <>
          {handle}
          <div className="min-w-0 flex-1">
            {fid === 'title' ? (
              <input
                className={field}
                value={p.title}
                onChange={(e) =>
                  onChange({ ...block, props: { ...p, title: e.target.value } })
                }
                placeholder={t('proposals.fields.sectionTitle')}
              />
            ) : null}
            {fid === 'body' ? (
              <textarea
                className={cn(field, 'min-h-[100px]')}
                value={p.body}
                onChange={(e) =>
                  onChange({ ...block, props: { ...p, body: e.target.value } })
                }
                placeholder={t('proposals.fields.body')}
              />
            ) : null}
            {fid === 'kpis' ? (
              <div className="min-w-0 space-y-2">
                <SortableFieldRows
                  blockId={`${block.id}::kpis`}
                  itemIds={kpis.map((_, i) => String(i))}
                  alignStart
                  containerClassName="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
                  listLabel={t('proposals.sortKpiCards')}
                  onReorder={(next) => {
                    const nextKpis = next.map((i) => kpis[Number(i)]).filter(Boolean)
                    if (nextKpis.length !== kpis.length) return
                    onChange({ ...block, props: { ...p, kpis: nextKpis } })
                  }}
                >
                  {(idxStr, rowHandle) => {
                    const idx = Number(idxStr)
                    const k = kpis[idx]
                    if (!k) return null
                    return (
                      <>
                        {rowHandle}
                        <div className="relative grid min-w-0 flex-1 gap-1 rounded border border-border/80 p-2 pt-8">
                          {kpis.length > 1 ? (
                            <button
                              type="button"
                              className="absolute right-1 top-1 rounded p-1 text-muted hover:bg-destructive/10 hover:text-destructive"
                              aria-label={t('proposals.editor.removeKpi')}
                              onClick={() => removeKpi(idx)}
                            >
                              <Trash2 size={14} aria-hidden />
                            </button>
                          ) : null}
                          <input
                            className={field}
                            value={k.label}
                            onChange={(e) => patchKpi(idx, { label: e.target.value })}
                            placeholder={t('proposals.fields.kpiLabel', { n: idx + 1 })}
                          />
                          <input
                            className={field}
                            value={k.value}
                            onChange={(e) => patchKpi(idx, { value: e.target.value })}
                            placeholder={t('proposals.fields.kpiValue', { n: idx + 1 })}
                          />
                        </div>
                      </>
                    )
                  }}
                </SortableFieldRows>
                <Button type="button" size="sm" variant="secondary" className="h-8 w-fit gap-1" onClick={addKpi}>
                  <Plus size={14} aria-hidden />
                  {t('proposals.editor.addKpi')}
                </Button>
              </div>
            ) : null}
          </div>
        </>
      )}
    </SortableFieldRows>
  )
}
