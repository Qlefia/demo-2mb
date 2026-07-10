import { forwardRef, useId, type TextareaHTMLAttributes } from 'react'

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
  hint?: string
}

function getDescribedBy(error: string | undefined, errorId: string, hint: string | undefined, hintId: string): string | undefined {
  if (error) return errorId
  if (hint) return hintId
  return undefined
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ error, hint, className = '', ...props }, ref) => {
    const id = useId()
    const errorId = `${id}-error`
    const hintId = `${id}-hint`
    return (
      <div className="flex flex-col gap-1.5">
        <textarea
          ref={ref}
          rows={4}
          className={`survey-brand-input w-full border bg-transparent px-3 py-2 text-sm transition-colors placeholder:text-muted outline-none focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
            error ? 'border-destructive' : 'border-input'
          } ${className}`}
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

TextArea.displayName = 'TextArea'
