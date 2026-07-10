'use client'

import type { ReactNode } from 'react'

interface FieldProps {
  htmlFor?: string
  label: string
  hint?: string
  children: ReactNode
  fullWidth?: boolean
}

export function Field({ htmlFor, label, hint, children, fullWidth }: FieldProps) {
  return (
    <div className={fullWidth ? 'col-span-full min-w-0' : 'min-w-0'}>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted"
      >
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-muted">{hint}</p>}
    </div>
  )
}
