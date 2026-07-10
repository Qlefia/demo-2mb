'use client'

import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { studioRadiusControl } from '@/features/studio-settings/studioBlockChrome'

export interface StudioAiAssistTriggerProps {
  /** When set, the control is active; otherwise it is a visible placeholder until the API is wired. */
  onAssist?: () => void | Promise<void>
  /** Hide the text label and show icon-only (still has accessible name). */
  compact?: boolean
  className?: string
}

export function StudioAiAssistTrigger({ onAssist, compact, className }: StudioAiAssistTriggerProps) {
  const { t } = useTranslation()
  const active = Boolean(onAssist)
  const label = t('studioSettings.ai.writeWithAi')

  return (
    <button
      type="button"
      disabled={!active}
      onClick={() => {
        if (onAssist) void onAssist()
      }}
      title={active ? label : t('studioSettings.ai.comingSoonTooltip')}
      aria-label={label}
      className={cn(
        `inline-flex shrink-0 items-center gap-1 ${studioRadiusControl} px-2 py-1 text-xs font-medium transition-colors`,
        active
          ? 'text-foreground hover:bg-foreground/6 active:bg-foreground/9'
          : 'cursor-default text-muted hover:text-foreground',
        className,
      )}
    >
      <Sparkles size={14} className="shrink-0 opacity-80" aria-hidden />
      {!compact ? <span>{label}</span> : null}
    </button>
  )
}
