import { forwardRef, type ReactNode } from 'react'
import { Plus } from 'lucide-react'

interface DashedAddButtonProps {
  onClick?: () => void
  children: ReactNode
  className?: string
}

export const DashedAddButton = forwardRef<HTMLButtonElement, DashedAddButtonProps>(
  function DashedAddButton({ onClick, children, className = '' }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        className={`flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border bg-background px-3 py-2.5 text-xs text-muted transition-colors hover:border-primary/30 hover:text-foreground ${className}`}
      >
        <Plus size={14} />
        {children}
      </button>
    )
  },
)
