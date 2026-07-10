'use client'

import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { Settings2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/components/atoms'

interface ColumnPickerProps {
  columns: { key: string; label: string }[]
  visible: string[]
  onChange: (visible: string[]) => void
}

export function ColumnPicker({ columns, visible, onChange }: ColumnPickerProps) {
  const { t } = useTranslation()

  function handleToggle(key: string, checked: boolean) {
    if (checked) {
      onChange([...visible, key])
    } else {
      onChange(visible.filter((k) => k !== key))
    }
  }

  return (
    <Popover className="relative">
      <PopoverButton
        className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-muted outline-none transition-colors hover:text-foreground focus-visible:outline-none"
        aria-label={t('leads.columns')}
      >
        <Settings2 size={16} strokeWidth={1.5} />
      </PopoverButton>
      <PopoverPanel
        className="absolute right-0 z-50 mt-2 w-56 rounded-sm border border-border bg-background p-3 focus:outline-none"
      >
        <div className="flex flex-col gap-2">
          {columns.map((col) => (
            <label key={col.key} className="flex cursor-pointer items-center gap-2">
              <Checkbox
                checked={visible.includes(col.key)}
                onChange={(checked) => handleToggle(col.key, checked)}
              />
              <span className="text-sm">{col.label}</span>
            </label>
          ))}
        </div>
      </PopoverPanel>
    </Popover>
  )
}
