'use client'

import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'

type ChipVariant = 'default' | 'active'
type ChipSize = 'sm' | 'md'

interface ChipProps {
  children: ReactNode
  variant?: ChipVariant
  size?: ChipSize
  onRemove?: () => void
  className?: string
}

const variantClasses: Record<ChipVariant, string> = {
  default: 'border border-border text-muted',
  active: 'bg-primary text-primary-foreground',
}

const sizeClasses: Record<ChipSize, string> = {
  sm: 'h-6 px-2 text-xs gap-1',
  md: 'h-7 px-2.5 text-xs gap-1.5',
}

export function Chip({ children, variant = 'default', size = 'sm', onRemove, className = '' }: ChipProps) {
  const { t } = useTranslation()
  return (
    <span
      className={`inline-flex items-center rounded-sm font-medium ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 inline-flex items-center justify-center rounded-sm transition-colors hover:bg-primary/10"
          aria-label={t('editor.remove')}
        >
          <X size={12} strokeWidth={2} />
        </button>
      )}
    </span>
  )
}
