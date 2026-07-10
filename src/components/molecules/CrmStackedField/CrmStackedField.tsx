import type { ReactNode } from 'react'
import { Label } from '@/components/atoms'
import { cn } from '@/lib/cn'

const EMPTY = '—'

type CrmStackedFieldProps = {
  label: string
  htmlFor?: string
  /** Edit mode — control rendered below the label. */
  children?: ReactNode
  /** Read mode — value rendered below the label (omit `children`). */
  value?: ReactNode
  emptyPlaceholder?: string
  valueClassName?: string
  className?: string
}

/** Label on top, value or control below — CRM detail / form field pattern. */
export function CrmStackedField({
  label,
  htmlFor,
  children,
  value,
  emptyPlaceholder = EMPTY,
  valueClassName,
  className,
}: CrmStackedFieldProps) {
  const isRead = children === undefined

  return (
    <div className={cn('py-3', className)}>
      {htmlFor ? (
        <Label htmlFor={htmlFor} className="text-xs font-normal text-muted">
          {label}
        </Label>
      ) : (
        <p className="text-xs text-muted">{label}</p>
      )}
      <div className="mt-1">
        {isRead ? (
          <div className={cn('text-sm text-foreground', valueClassName)}>
            {value === undefined || value === null || value === '' ? emptyPlaceholder : value}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

type CrmStackedFieldListProps = {
  children: ReactNode
  className?: string
  /** Tinted panel chrome (studio sidebar style). */
  tinted?: boolean
}

export function CrmStackedFieldList({ children, className, tinted = true }: CrmStackedFieldListProps) {
  return (
    <div
      className={cn(
        'divide-y divide-border/60',
        tinted && 'rounded-xl bg-foreground/[0.04] px-3 dark:bg-white/[0.05]',
        className,
      )}
    >
      {children}
    </div>
  )
}
