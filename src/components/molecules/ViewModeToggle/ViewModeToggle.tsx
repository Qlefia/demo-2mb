'use client'

import { LayoutList, LayoutGrid, Columns3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'

type ViewMode = 'list' | 'card' | 'kanban'

const MODE_CONFIG: { value: ViewMode; icon: typeof LayoutList }[] = [
  { value: 'list', icon: LayoutList },
  { value: 'card', icon: LayoutGrid },
  { value: 'kanban', icon: Columns3 },
]

interface ViewModeToggleProps {
  mode: ViewMode
  onChange: (mode: ViewMode) => void
  options?: ViewMode[]
  compact?: boolean
  stretch?: boolean
}

export function ViewModeToggle({
  mode,
  onChange,
  options = ['list', 'card', 'kanban'],
  compact = false,
  stretch = false,
}: ViewModeToggleProps) {
  const { t } = useTranslation()
  const items = MODE_CONFIG.filter((c) => options.includes(c.value))

  if (compact) {
    return (
      <div className="flex shrink-0 items-center gap-0.5">
        {items.map(({ value, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            aria-label={t(`viewMode.${value}`)}
            className={cn(
              'rounded p-1.5 transition-colors outline-none focus-visible:outline-none',
              mode === value ? 'bg-muted/50 text-foreground' : 'text-muted hover:bg-muted/30 hover:text-foreground',
            )}
          >
            <Icon size={14} strokeWidth={1.5} />
          </button>
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex h-8 overflow-hidden rounded-sm border border-border',
        stretch ? 'w-full' : 'shrink-0',
      )}
    >
      {items.map(({ value, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          aria-label={t(`viewMode.${value}`)}
          className={cn(
            'flex h-8 items-center justify-center transition-colors outline-none focus-visible:outline-none',
            stretch ? 'min-w-0 flex-1' : 'w-8',
            mode === value
              ? 'bg-muted/50 text-foreground'
              : 'text-muted hover:bg-muted/30 hover:text-foreground',
          )}
        >
          <Icon size={16} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  )
}
