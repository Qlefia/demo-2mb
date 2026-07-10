import type { TFunction } from 'i18next'
import { CalendarClock, Trash2, X } from 'lucide-react'
import type { DropdownMenuEntry } from '@/components/molecules/DropdownMenu'

export type MeetingSheetMenuHandlers = {
  onReschedule: () => void
  onCancel: () => void
  onDelete: () => void
  disabled?: boolean
}

export function buildMeetingSheetMenuItems(
  t: TFunction,
  isScheduled: boolean,
  handlers: MeetingSheetMenuHandlers,
): DropdownMenuEntry[] {
  const disabled = handlers.disabled ?? false
  const items: DropdownMenuEntry[] = []

  if (isScheduled) {
    items.push(
      {
        label: t('calendar.sheet.actions.reschedule'),
        icon: CalendarClock,
        disabled,
        onClick: handlers.onReschedule,
      },
      {
        label: t('calendar.sheet.actions.cancel'),
        icon: X,
        disabled,
        onClick: handlers.onCancel,
      },
      { separator: true },
    )
  }

  items.push({
    label: t('calendar.sheet.actions.delete'),
    icon: Trash2,
    variant: 'destructive',
    disabled,
    onClick: handlers.onDelete,
  })

  return items
}
