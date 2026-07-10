'use client'

import { useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { dossierFieldSurface } from './dossierSectionLayout'

interface TagListEditorProps {
  values: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  disabled?: boolean
}

function splitDraft(raw: string): string[] {
  return raw
    .split(/\s*[,;/]+\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function expandTagValues(values: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const value of values) {
    const parts = splitDraft(value)
    const items = parts.length > 0 ? parts : [value.trim()].filter(Boolean)
    for (const item of items) {
      if (!seen.has(item)) {
        seen.add(item)
        out.push(item)
      }
    }
  }
  return out
}

export function TagListEditor({ values, onChange, placeholder, disabled }: TagListEditorProps) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState('')
  const visibleTags = expandTagValues(values)

  const commit = () => {
    const parts = splitDraft(draft)
    if (parts.length === 0) return

    const next = [...visibleTags]
    for (const part of parts) {
      if (!next.includes(part)) next.push(part)
    }
    onChange(next)
    setDraft('')
  }

  const remove = (index: number) => {
    onChange(visibleTags.filter((_, i) => i !== index))
  }

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commit()
    }
    if (e.key === 'Backspace' && draft === '' && visibleTags.length > 0) {
      remove(visibleTags.length - 1)
    }
  }

  if (disabled && visibleTags.length === 0) {
    return <p className="text-sm text-muted">—</p>
  }

  return (
    <div className="w-full min-w-0">
      <div
        className={cn(
          dossierFieldSurface,
          'flex w-full min-w-0 flex-wrap items-center gap-1.5 px-2.5 py-2',
          !disabled && visibleTags.length === 0 && 'min-h-10',
        )}
      >
        {visibleTags.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex max-w-full min-w-0 items-center gap-1 rounded-md border border-border/80 bg-background/80 py-0.5 pl-2 pr-1 text-xs text-foreground"
          >
            <span className="min-w-0 truncate" title={tag}>
              {tag}
            </span>
            {!disabled && (
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={t('common.remove')}
                className="inline-flex shrink-0 items-center justify-center rounded-sm p-0.5 text-muted transition-colors hover:bg-primary/10 hover:text-foreground"
              >
                <X size={12} strokeWidth={2} />
              </button>
            )}
          </span>
        ))}
        {!disabled && (
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKey}
            onBlur={commit}
            placeholder={visibleTags.length === 0 ? placeholder : undefined}
            className="min-w-20 flex-1 basis-24 border-0 bg-transparent py-0.5 text-sm outline-none placeholder:text-muted focus:outline-none"
          />
        )}
      </div>
    </div>
  )
}
