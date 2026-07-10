import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { PAGE_FRAME_CLASS } from '@/lib/layout/pageFrame'

interface ContainerProps {
  children: ReactNode
  className?: string
}

export function Container({ children, className = '' }: ContainerProps) {
  return <div className={cn(PAGE_FRAME_CLASS, className)}>{children}</div>
}
