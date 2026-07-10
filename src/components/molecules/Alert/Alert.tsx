import type { ReactNode } from 'react'
import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type AlertVariant = 'info' | 'success' | 'warning' | 'error'

interface AlertProps {
  variant?: AlertVariant
  children: ReactNode
  className?: string
}

const config: Record<AlertVariant, { icon: LucideIcon; classes: string }> = {
  info: { icon: Info, classes: 'border-info/20 bg-info/5 text-info' },
  success: { icon: CheckCircle, classes: 'border-success/20 bg-success/5 text-success' },
  warning: { icon: AlertTriangle, classes: 'border-warning/20 bg-warning/5 text-warning' },
  error: { icon: AlertCircle, classes: 'border-destructive/20 bg-destructive/5 text-destructive' },
}

export function Alert({ variant = 'info', children, className = '' }: AlertProps) {
  const { icon: Icon, classes } = config[variant]

  return (
    <div
      className={`flex items-start gap-3 rounded-sm border p-4 ${classes} ${className}`}
      role="alert"
    >
      <Icon size={16} className="mt-0.5 shrink-0" strokeWidth={1.5} />
      <div className="text-sm">{children}</div>
    </div>
  )
}
