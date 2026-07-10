'use client'

import { Fragment, type ReactNode } from 'react'
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface DropdownMenuItem {
  label: string
  icon?: LucideIcon
  onClick: () => void
  variant?: 'default' | 'destructive'
  disabled?: boolean
}

export interface DropdownMenuSeparator {
  separator: true
}

export type DropdownMenuEntry = DropdownMenuItem | DropdownMenuSeparator

function isSeparator(entry: DropdownMenuEntry): entry is DropdownMenuSeparator {
  return 'separator' in entry && entry.separator === true
}

interface DropdownMenuProps {
  trigger: ReactNode
  items: DropdownMenuEntry[]
  align?: 'left' | 'right'
}

export function DropdownMenu({ trigger, items, align = 'right' }: DropdownMenuProps) {
  return (
    <Menu as="div" className="relative">
      <MenuButton as={Fragment}>{trigger}</MenuButton>
      <Transition
        enter="transition duration-100 ease-out"
        enterFrom="scale-95 opacity-0"
        enterTo="scale-100 opacity-100"
        leave="transition duration-75 ease-in"
        leaveFrom="scale-100 opacity-100"
        leaveTo="scale-95 opacity-0"
      >
        <MenuItems
          anchor={align === 'right' ? 'bottom end' : 'bottom start'}
          className="z-50 min-w-[180px] rounded-sm border border-border bg-background py-1 focus:outline-none [--anchor-gap:4px]"
        >
          {items.map((entry, i) => {
            if (isSeparator(entry)) {
              return <div key={`sep-${i}`} className="my-1 border-t border-border" />
            }

            const Icon = entry.icon
            return (
              <MenuItem key={entry.label} disabled={entry.disabled}>
                {({ focus }) => (
                  <button
                    type="button"
                    onClick={entry.onClick}
                    disabled={entry.disabled}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm',
                      focus && 'bg-primary/5',
                      entry.variant === 'destructive' ? 'text-destructive' : 'text-foreground',
                      entry.disabled && 'cursor-not-allowed opacity-50',
                    )}
                  >
                    {Icon && <Icon size={14} className="shrink-0" />}
                    {entry.label}
                  </button>
                )}
              </MenuItem>
            )
          })}
        </MenuItems>
      </Transition>
    </Menu>
  )
}
