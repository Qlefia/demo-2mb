'use client'

import { forwardRef, useId, useState, type InputHTMLAttributes } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/cn'

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  error?: string
  hint?: string
}

function getDescribedBy(
  error: string | undefined,
  errorId: string,
  hint: string | undefined,
  hintId: string,
): string | undefined {
  if (error) return errorId
  if (hint) return hintId
  return undefined
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ error, hint, className = '', disabled, ...props }, ref) => {
    const { t } = useTranslation()
    const [visible, setVisible] = useState(false)
    const id = useId()
    const errorId = `${id}-error`
    const hintId = `${id}-hint`

    return (
      <div className="flex flex-col gap-1.5">
        <div className="relative">
          <input
            ref={ref}
            type={visible ? 'text' : 'password'}
            disabled={disabled}
            className={cn(
              'survey-brand-input h-10 w-full border bg-transparent px-3 pr-10 text-sm transition-colors placeholder:text-muted outline-none focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
              error ? 'border-destructive' : 'border-input',
              className,
            )}
            aria-invalid={error ? true : undefined}
            aria-describedby={getDescribedBy(error, errorId, hint, hintId)}
            {...props}
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => setVisible((v) => !v)}
            className="absolute right-1.5 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-sm text-muted transition-colors hover:text-foreground focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none"
            aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
            aria-pressed={visible}
          >
            {visible ? (
              <EyeOff size={16} strokeWidth={1.5} aria-hidden />
            ) : (
              <Eye size={16} strokeWidth={1.5} aria-hidden />
            )}
          </button>
        </div>
        {error && <p id={errorId} className="text-xs text-destructive">{error}</p>}
        {!error && hint && <p id={hintId} className="text-xs text-muted">{hint}</p>}
      </div>
    )
  },
)

PasswordInput.displayName = 'PasswordInput'
