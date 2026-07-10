'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/atoms'
import type { ProposalBlock } from '@/lib/proposals/blockSchema'

type TagDto = { id: string; slug: string; labelDe: string; labelEn: string }

export function ServiceTagsBlockEditor({
  block,
  onChange,
  proposalLanguage,
  field,
}: {
  block: Extract<ProposalBlock, { type: 'service_tags' }>
  onChange: (next: ProposalBlock) => void
  proposalLanguage: 'de' | 'en'
  field: string
}) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<TagDto[]>([])

  const pickLabel = useMemo(
    () => (row: TagDto) => (proposalLanguage === 'de' ? row.labelDe : row.labelEn),
    [proposalLanguage],
  )

  useEffect(() => {
    const timer = globalThis.setTimeout(() => {
      void fetch(`/api/service-tags?q=${encodeURIComponent(query)}&limit=40`, {
        credentials: 'include',
      })
        .then((r) => r.json())
        .then((j: { items?: TagDto[] }) => {
          setHits(Array.isArray(j.items) ? j.items : [])
        })
        .catch(() => setHits([]))
    }, 260)
    return () => clearTimeout(timer)
  }, [query])

  const removeAt = (idx: number) => {
    const entries = block.props.entries.filter((_, i) => i !== idx)
    onChange({ ...block, props: { ...block.props, entries } })
  }

  const addRow = (row: TagDto) => {
    const label = pickLabel(row)
    if (block.props.entries.some((e) => e.sourceId === row.id)) return
    onChange({
      ...block,
      props: {
        ...block.props,
        entries: [...block.props.entries, { sourceId: row.id, label }],
      },
    })
  }

  const addCustom = () => {
    const label = query.trim()
    if (!label) return
    if (
      block.props.entries.some((e) => e.label.toLowerCase() === label.toLowerCase())
    ) {
      return
    }
    onChange({
      ...block,
      props: {
        ...block.props,
        entries: [...block.props.entries, { sourceId: null, label }],
      },
    })
    setQuery('')
  }

  return (
    <div className="grid min-w-0 gap-3">
      <label className="text-xs font-medium text-muted" htmlFor={`st-title-${block.id}`}>
        {t('proposals.fields.sectionTitle')}
      </label>
      <input
        id={`st-title-${block.id}`}
        className={field}
        value={block.props.title}
        onChange={(e) =>
          onChange({ ...block, props: { ...block.props, title: e.target.value } })
        }
      />

      <div>
        <p className="mb-1.5 text-xs text-muted">{t('proposals.serviceTags.selected')}</p>
        <ul className="flex flex-wrap gap-1.5">
          {block.props.entries.map((e, idx) => (
            <li
              key={`${e.sourceId ?? 'x'}-${idx}`}
              className="inline-flex max-w-full items-center gap-1 rounded-md border border-border bg-muted/30 px-2 py-0.5 text-xs"
            >
              <span className="min-w-0 truncate">{e.label}</span>
              <button
                type="button"
                className="shrink-0 rounded p-0.5 text-muted hover:text-destructive"
                aria-label={t('proposals.serviceTags.removeTag')}
                onClick={() => removeAt(idx)}
              >
                <Trash2 size={12} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-2">
        <label className="text-xs font-medium text-muted" htmlFor={`st-q-${block.id}`}>
          {t('proposals.serviceTags.searchLibrary')}
        </label>
        <input
          id={`st-q-${block.id}`}
          className={field}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('proposals.serviceTags.searchPlaceholder')}
        />
        <div className="max-h-36 overflow-y-auto rounded-md border border-border bg-background">
          {hits.length === 0 ? (
            <p className="px-2 py-3 text-xs text-muted">{t('proposals.serviceTags.noResults')}</p>
          ) : (
            <ul className="divide-y divide-border">
              {hits.map((h) => (
                <li key={h.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-2 px-2 py-1.5 text-left text-xs hover:bg-muted/50"
                    onClick={() => addRow(h)}
                  >
                    <span className="min-w-0">{pickLabel(h)}</span>
                    <span className="shrink-0 text-[10px] text-muted">{h.slug}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="h-8 w-fit"
          onClick={addCustom}
        >
          {t('proposals.serviceTags.addCustom')}
        </Button>
      </div>
    </div>
  )
}
