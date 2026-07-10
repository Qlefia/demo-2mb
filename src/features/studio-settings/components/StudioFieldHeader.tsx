'use client'

import type { ReactNode } from 'react'
import { Label } from '@/components/atoms'
import { StudioAiAssistTrigger } from '@/features/studio-settings/components/StudioAiAssistTrigger'

interface StudioFieldHeaderProps {
  /** Omit when the field is not a single native control (e.g. image upload). */
  htmlFor?: string
  label: ReactNode
  /** What this control affects — shown under the label. */
  hint?: ReactNode
  showAi?: boolean
  onAiAssist?: () => void | Promise<void>
  /** Icon-only AI chip to save horizontal space in dense grids. */
  aiCompact?: boolean
}

export function StudioFieldHeader({
  htmlFor,
  label,
  hint,
  showAi = true,
  onAiAssist,
  aiCompact,
}: StudioFieldHeaderProps) {
  return (
    <div className="space-y-0.5">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <Label htmlFor={htmlFor}>{label}</Label>
        {showAi ? <StudioAiAssistTrigger onAssist={onAiAssist} compact={aiCompact} /> : null}
      </div>
      {hint ? <p className="text-xs text-pretty text-muted">{hint}</p> : null}
    </div>
  )
}
