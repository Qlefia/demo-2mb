'use client'

import { useTranslation } from 'react-i18next'
import { PLAYBOOK_SECTION_ORDER, type PlaybookSections } from '@/lib/playbooks/schema'
import { cn } from '@/lib/cn'

interface PlaybookScriptReaderProps {
  sections: PlaybookSections
  body: string
  emptyLabel: string
  className?: string
}

function parseMarkdownSections(body: string): { title: string; text: string }[] {
  const chunks = body.split(/^## /m).filter(Boolean)
  return chunks.map((chunk) => {
    const newline = chunk.indexOf('\n')
    if (newline === -1) return { title: chunk.trim(), text: '' }
    return {
      title: chunk.slice(0, newline).trim(),
      text: chunk.slice(newline + 1).trim(),
    }
  })
}

export function PlaybookScriptReader({
  sections,
  body,
  emptyLabel,
  className,
}: PlaybookScriptReaderProps) {
  const { t } = useTranslation()

  const structured = PLAYBOOK_SECTION_ORDER.flatMap((key) => {
    const text = sections[key]?.trim()
    if (!text) return []
    return [
      {
        key,
        title: t(`studioSettings.playbooks.sections.${key}.label`),
        text,
      },
    ]
  })

  const fallbackBlocks = structured.length === 0 && body.trim() ? parseMarkdownSections(body.trim()) : []

  if (structured.length === 0 && fallbackBlocks.length === 0) {
    return <p className="text-xs text-muted">{emptyLabel}</p>
  }

  return (
    <div
      className={cn(
        'w-full min-w-0 overflow-y-auto rounded-[var(--form-field-radius)]',
        'bg-foreground/[0.04] px-3 py-3 dark:bg-white/[0.05]',
        className,
      )}
    >
      <div className="space-y-4">
        {structured.map((block) => (
          <section key={block.key} className="min-w-0">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              {block.title}
            </h4>
            <p className="mt-1.5 break-words whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {block.text}
            </p>
          </section>
        ))}
        {fallbackBlocks.map((block, i) => (
          <section key={`${block.title}-${i}`} className="min-w-0">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              {block.title}
            </h4>
            <p className="mt-1.5 break-words whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {block.text}
            </p>
          </section>
        ))}
      </div>
    </div>
  )
}
