import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Spinner } from '../Spinner'
import { cn } from '@/lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80',
  secondary: 'border border-border bg-transparent text-foreground hover:bg-hover active:bg-primary/10',
  ghost: 'bg-transparent text-foreground hover:bg-hover active:bg-primary/10 focus:bg-transparent',
  destructive: 'bg-destructive text-white hover:bg-destructive/90 active:bg-destructive/80',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, disabled, children, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'survey-brand-button inline-flex items-center justify-center font-medium transition-colors outline-none focus:outline-none focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading && <Spinner size={size === 'sm' ? 14 : 16} className="text-current" />}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
