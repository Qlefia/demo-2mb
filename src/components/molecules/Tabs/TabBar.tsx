'use client'

import { Tab, TabGroup, TabList } from '@headlessui/react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import {
  tabListPillShellClass,
  tabListSectionNavClass,
  tabListSegmentedClass,
  tabListSegmentedShellClass,
  tabNavShellStaticClass,
  tabTriggerClass,
  tabTriggerPillClass,
  tabTriggerSectionClass,
  tabTriggerSegmentedClass,
} from './tabListStyles'

export type TabBarItem = {
  id: string
  label: ReactNode
  disabled?: boolean
}

export type TabBarVariant = 'section' | 'underline' | 'segmented' | 'pill'

type TabBarProps = {
  items: readonly TabBarItem[]
  selectedId: string
  onChange: (id: string) => void
  ariaLabel: string
  variant?: TabBarVariant
  className?: string
  /** Prefix for `id` / `aria-controls` on triggers and linked panels. */
  panelIdPrefix?: string
  /** Optional suffix on trigger ids (e.g. prospect id for uniqueness). */
  triggerIdSuffix?: string
}

function resolveShellClass(variant: TabBarVariant): string | undefined {
  switch (variant) {
    case 'segmented':
      return tabListSegmentedShellClass
    case 'pill':
      return tabListPillShellClass
    case 'section':
    case 'underline':
      return cn(
        tabNavShellStaticClass,
        'min-w-0 max-w-full',
        variant === 'underline' && 'border-b border-border',
      )
    default:
      return undefined
  }
}

function resolveListClass(variant: TabBarVariant): string {
  switch (variant) {
    case 'section':
      return tabListSectionNavClass
    case 'segmented':
      return tabListSegmentedClass
    case 'pill':
      return 'flex flex-wrap gap-0.5'
    case 'underline':
      return cn(
        'flex min-w-0 flex-nowrap items-center gap-x-4 overflow-x-auto overscroll-x-contain lg:gap-x-6',
      )
    default:
      return ''
  }
}

function resolveTriggerClass(variant: TabBarVariant): string {
  switch (variant) {
    case 'section':
      return cn(tabTriggerSectionClass, 'inline-flex shrink-0 whitespace-nowrap')
    case 'segmented':
      return tabTriggerSegmentedClass
    case 'pill':
      return tabTriggerPillClass
    case 'underline':
      return cn(tabTriggerClass, 'px-0')
    default:
      return tabTriggerClass
  }
}

export function TabBar({
  items,
  selectedId,
  onChange,
  ariaLabel,
  variant = 'underline',
  className,
  panelIdPrefix = 'tab-panel',
  triggerIdSuffix,
}: TabBarProps) {
  const selectedIndex = Math.max(
    0,
    items.findIndex((item) => item.id === selectedId),
  )

  const shellClass = resolveShellClass(variant)
  const listClass = resolveListClass(variant)
  const triggerClass = resolveTriggerClass(variant)

  return (
    <TabGroup
      selectedIndex={selectedIndex}
      onChange={(index) => {
        const next = items[index]
        if (next && !next.disabled) onChange(next.id)
      }}
    >
      <nav aria-label={ariaLabel} className={cn(shellClass, className)}>
        <TabList className={listClass}>
          {items.map((item) => {
            const triggerId = triggerIdSuffix
              ? `${panelIdPrefix}-tab-${item.id}-${triggerIdSuffix}`
              : `${panelIdPrefix}-tab-${item.id}`
            const panelId = `${panelIdPrefix}-${item.id}`

            return (
              <Tab
                key={item.id}
                id={triggerId}
                disabled={item.disabled}
                aria-controls={panelId}
                className={cn(triggerClass, variant === 'underline' && 'shrink-0')}
              >
                {item.label}
              </Tab>
            )
          })}
        </TabList>
      </nav>
    </TabGroup>
  )
}
