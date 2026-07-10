import { Popover as HeadlessPopover, PopoverButton, PopoverPanel } from '@headlessui/react'
import type { ReactNode } from 'react'

interface PopoverProps {
  trigger: ReactNode
  children: ReactNode
  className?: string
  anchor?: 'bottom' | 'bottom start' | 'bottom end' | 'top' | 'top start' | 'top end'
}

export function Popover({ trigger, children, className = '', anchor = 'bottom end' }: PopoverProps) {
  return (
    <HeadlessPopover className="relative">
      <PopoverButton as="div" className="cursor-pointer">
        {trigger}
      </PopoverButton>

      <PopoverPanel
        anchor={anchor}
        className={`z-50 border border-border bg-background p-4 rounded-sm [--anchor-padding:0.5rem] ${className}`}
      >
        {children}
      </PopoverPanel>
    </HeadlessPopover>
  )
}
