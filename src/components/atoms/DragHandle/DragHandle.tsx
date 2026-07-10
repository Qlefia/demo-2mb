'use client'

import { GripVertical } from 'lucide-react'
import type { HTMLAttributes } from 'react'
import { useTranslation } from 'react-i18next'

interface DragHandleProps extends HTMLAttributes<HTMLButtonElement> {
  className?: string
}

export function DragHandle({ className = '', ...props }: DragHandleProps) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      className={`inline-flex cursor-grab items-center justify-center text-muted outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:cursor-grabbing ${className}`}
      aria-label={t('builder.dragToReorder')}
      {...props}
    >
      <GripVertical size={16} strokeWidth={1.5} />
    </button>
  )
}
