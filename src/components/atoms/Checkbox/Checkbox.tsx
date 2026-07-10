import { forwardRef } from 'react'
import { Checkbox as HeadlessCheckbox } from '@headlessui/react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
  /** Extra classes on the label span (when `label` is set). */
  labelClassName?: string
  /** Accessible name when `label` is omitted (icon-only toggle). */
  ariaLabel?: string
}

export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(function Checkbox(
  { checked, onChange, disabled, label, labelClassName, ariaLabel },
  ref,
) {
  return (
    <div className="flex items-center gap-2">
      <HeadlessCheckbox
        ref={ref}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        aria-label={ariaLabel}
        className="survey-brand-control flex h-4 w-4 shrink-0 items-center justify-center border border-input transition-colors outline-none focus:outline-none data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground data-checked:ring-2 data-checked:ring-foreground/20 data-disabled:cursor-not-allowed data-disabled:opacity-50"
      >
        {checked && <Check size={12} className="shrink-0 text-primary-foreground" strokeWidth={2.5} />}
      </HeadlessCheckbox>
      {label && (
        <span className={cn('text-sm', disabled && 'opacity-50', labelClassName)}>{label}</span>
      )}
    </div>
  )
})
Checkbox.displayName = 'Checkbox'
