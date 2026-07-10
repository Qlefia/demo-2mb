import { forwardRef, useId, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
  hint?: string
}

function getDescribedBy(error: string | undefined, errorId: string, hint: string | undefined, hintId: string): string | undefined {
  if (error) return errorId
  if (hint) return hintId
  return undefined
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, hint, className = '', ...props }, ref) => {
    const id = useId()
    const errorId = `${id}-error`
    const hintId = `${id}-hint`
    return (
      <div className="flex flex-col gap-1.5">
        <input
          ref={ref}
          className={cn(
            'survey-brand-input h-10 w-full border bg-transparent px-3 text-sm transition-colors placeholder:text-muted outline-none focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-destructive' : 'border-input',
            className
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={getDescribedBy(error, errorId, hint, hintId)}
          {...props}
        />
        {error && <p id={errorId} className="text-xs text-destructive">{error}</p>}
        {!error && hint && <p id={hintId} className="text-xs text-muted">{hint}</p>}
      </div>
    )
  },
)

Input.displayName = 'Input'
