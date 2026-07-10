interface DividerProps {
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

export function Divider({ orientation = 'horizontal', className = '' }: DividerProps) {
  if (orientation === 'vertical') {
    return <div className={`w-px self-stretch bg-border ${className}`} role="separator" aria-orientation="vertical" />
  }
  return <hr className={`border-0 border-t border-border ${className}`} />
}
