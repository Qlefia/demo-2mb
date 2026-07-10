import { forwardRef, type ButtonHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'

type IconButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive'
type IconButtonSize = 'xs' | 'sm' | 'md'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon
  variant?: IconButtonVariant
  size?: IconButtonSize
  label: string
  hasBadge?: boolean
}

const variantClasses: Record<IconButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80',
  secondary: 'border border-border bg-transparent text-foreground hover:bg-hover active:bg-primary/10',
  ghost: 'bg-transparent text-muted hover:bg-hover hover:text-foreground active:bg-primary/10',
  destructive: 'bg-transparent text-muted hover:bg-destructive/10 hover:text-destructive active:bg-destructive/20',
}

const sizeClasses: Record<IconButtonSize, string> = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
}

const iconSizes: Record<IconButtonSize, number> = {
  xs: 14,
  sm: 16,
  md: 18,
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon: Icon, variant = 'ghost', size = 'sm', label, disabled, hasBadge, className = '', ...props }, ref) => {
    const button = (
      <button
        ref={ref}
        disabled={disabled}
        aria-label={label}
        className={`survey-brand-control inline-flex items-center justify-center transition-colors outline-none focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${hasBadge ? '' : className}`}
        {...props}
      >
        <Icon size={iconSizes[size]} strokeWidth={1.5} />
      </button>
    )

    if (!hasBadge) return button

    return (
      <span className={`relative inline-block ${className}`}>
        {button}
        <span
          className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-primary"
          aria-hidden
        />
      </span>
    )
  },
)

IconButton.displayName = 'IconButton'
