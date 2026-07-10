'use client'

import { useTranslation } from 'react-i18next'
import { CalendarDays, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Users } from 'lucide-react'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { Button, IconButton } from '@/components/atoms'
import { Popover as UiPopover } from '@/components/molecules'
import { Select } from '@/components/molecules/Select'
import { CalendarMiniPicker } from '@/features/calendar/components/CalendarMiniPicker'
import { cn } from '@/lib/cn'
import {
  TOOLBAR_ICON_SQUARE_CLASS,
  TOOLBAR_PANEL_SELECT_CLASS,
  TOOLBAR_SEGMENTED_GROUP_CLASS,
} from '@/lib/layout/toolbarPanelStyles'
import type { AssignableOwner } from '@/lib/team/types'
import type { CalendarScope, CalendarView } from '@/lib/meetings/schema'
import { formatDate } from '@/lib/intl/datetime'
import { addDays, endOfWeek, startOfMonth, startOfWeek } from '@/lib/calendar/range'

interface CalendarToolbarProps {
  anchor: Date
  view: CalendarView
  scope: CalendarScope
  teamMemberId: string
  canFilterTeam: boolean
  owners: AssignableOwner[]
  locale: string
  onAnchorChange: (d: Date) => void
  onViewChange: (v: CalendarView) => void
  onScopeChange: (s: CalendarScope) => void
  onTeamMemberChange: (id: string) => void
  onCreateClick: () => void
}

const PERIOD_NAV_BTN =
  'flex h-8 items-center justify-center text-muted transition-colors outline-none hover:bg-muted/30 hover:text-foreground focus-visible:outline-none'

function PeriodNav({
  locale,
  anchor,
  onAnchorChange,
  onShift,
}: {
  locale: string
  anchor: Date
  onAnchorChange: (d: Date) => void
  onShift: (delta: number) => void
}) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(TOOLBAR_SEGMENTED_GROUP_CLASS)}
      role="group"
      aria-label={t('calendar.periodNavAria')}
    >
      <button
        type="button"
        aria-label={t('calendar.prev')}
        className={cn(PERIOD_NAV_BTN, 'w-8 shrink-0')}
        onClick={() => onShift(-1)}
      >
        <ChevronLeft size={16} strokeWidth={1.5} aria-hidden />
      </button>

      <Popover className="relative flex">
        <PopoverButton
          className={cn(
            PERIOD_NAV_BTN,
            'border-x border-border px-3 text-xs font-medium text-foreground data-open:bg-muted/30 max-sm:px-2.5',
          )}
          aria-label={t('calendar.datePicker.open')}
        >
          {t('calendar.today')}
        </PopoverButton>
        <PopoverPanel
          anchor="bottom start"
          className="z-50 rounded-sm border border-border bg-background p-3 [--anchor-padding:0.5rem] focus:outline-none"
        >
          {({ close }) => (
            <CalendarMiniPicker
              value={anchor}
              locale={locale}
              onSelect={(date) => {
                onAnchorChange(date)
                close()
              }}
              onToday={() => {
                onAnchorChange(new Date())
                close()
              }}
            />
          )}
        </PopoverPanel>
      </Popover>

      <button
        type="button"
        aria-label={t('calendar.next')}
        className={cn(PERIOD_NAV_BTN, 'w-8 shrink-0')}
        onClick={() => onShift(1)}
      >
        <ChevronRight size={16} strokeWidth={1.5} aria-hidden />
      </button>
    </div>
  )
}

function CalendarViewToggle({
  view,
  onChange,
  stretch = false,
}: {
  view: CalendarView
  onChange: (v: CalendarView) => void
  stretch?: boolean
}) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(TOOLBAR_SEGMENTED_GROUP_CLASS, stretch && 'w-full')}
      role="group"
      aria-label={t('calendar.view.toggleAria')}
    >
      {(
        [
          { value: 'week' as const, icon: CalendarDays, label: t('calendar.view.weekAria') },
          { value: 'month' as const, icon: CalendarIcon, label: t('calendar.view.monthAria') },
        ] as const
      ).map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          aria-label={label}
          aria-pressed={view === value}
          onClick={() => onChange(value)}
          className={cn(
            'flex h-8 items-center justify-center transition-colors outline-none focus-visible:outline-none',
            stretch ? 'min-w-0 flex-1' : 'w-8',
            view === value
              ? 'bg-muted/50 text-foreground'
              : 'text-muted hover:bg-muted/30 hover:text-foreground',
          )}
        >
          <Icon size={14} strokeWidth={1.5} aria-hidden />
        </button>
      ))}
    </div>
  )
}

function CalendarScopePopover({
  scope,
  teamMemberId,
  canFilterTeam,
  owners,
  scopeOptions,
  onScopeChange,
  onTeamMemberChange,
}: {
  scope: CalendarScope
  teamMemberId: string
  canFilterTeam: boolean
  owners: AssignableOwner[]
  scopeOptions: { value: string; label: string }[]
  onScopeChange: (s: CalendarScope) => void
  onTeamMemberChange: (id: string) => void
}) {
  const { t } = useTranslation()
  const showTeamMember = scope === 'team' && canFilterTeam

  return (
    <UiPopover
      anchor="bottom end"
      className="min-w-56"
      trigger={
        <button
          type="button"
          className={cn(TOOLBAR_ICON_SQUARE_CLASS, 'text-muted transition-colors hover:text-foreground')}
          aria-label={t('calendar.scope.settingsAria')}
        >
          <Users size={14} strokeWidth={1.5} />
        </button>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="crm-meta-label">{t('calendar.scope.settingsAria')}</div>
        <label className="flex flex-col gap-1 text-xs text-muted">
          {t('calendar.scope.label')}
          <select
            value={scope}
            onChange={(e) => onScopeChange(e.target.value as CalendarScope)}
            className={TOOLBAR_PANEL_SELECT_CLASS}
          >
            {scopeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {showTeamMember ? (
          <label className="flex flex-col gap-1 text-xs text-muted">
            {t('calendar.scope.teamMember')}
            <select
              value={teamMemberId}
              onChange={(e) => onTeamMemberChange(e.target.value)}
              className={TOOLBAR_PANEL_SELECT_CLASS}
            >
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.displayName}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
    </UiPopover>
  )
}

export function CalendarToolbar({
  anchor,
  view,
  scope,
  teamMemberId,
  canFilterTeam,
  owners,
  locale,
  onAnchorChange,
  onViewChange,
  onScopeChange,
  onTeamMemberChange,
  onCreateClick,
}: CalendarToolbarProps) {
  const { t } = useTranslation()

  const rangeLabel =
    view === 'week'
      ? `${formatDate(startOfWeek(anchor).toISOString(), locale)} – ${formatDate(endOfWeek(anchor).toISOString(), locale)}`
      : formatDate(startOfMonth(anchor).toISOString(), locale, { month: 'long', year: 'numeric' })

  function shiftAnchor(delta: number) {
    if (view === 'week') onAnchorChange(addDays(anchor, delta * 7))
    else onAnchorChange(new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1))
  }

  const scopeOptions = [
    { value: 'mine', label: t('calendar.scope.mine') },
    ...(canFilterTeam
      ? [
          { value: 'team', label: t('calendar.scope.team') },
          { value: 'all', label: t('calendar.scope.all') },
        ]
      : []),
  ]

  const viewOptions = [
    { value: 'week', label: t('calendar.view.week') },
    { value: 'month', label: t('calendar.view.month') },
  ]

  const showScopePopover = scopeOptions.length > 1

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
      <div className="flex items-start justify-between gap-2 sm:min-w-0 sm:flex-1 sm:items-center sm:justify-start sm:gap-2">
        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
          <PeriodNav
            locale={locale}
            anchor={anchor}
            onAnchorChange={onAnchorChange}
            onShift={shiftAnchor}
          />
          <span className="hidden truncate text-sm font-medium sm:inline">{rangeLabel}</span>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:hidden">
          <CalendarViewToggle view={view} onChange={onViewChange} />
          {showScopePopover ? (
            <CalendarScopePopover
              scope={scope}
              teamMemberId={teamMemberId}
              canFilterTeam={canFilterTeam}
              owners={owners}
              scopeOptions={scopeOptions}
              onScopeChange={onScopeChange}
              onTeamMemberChange={onTeamMemberChange}
            />
          ) : null}
          <IconButton
            icon={Plus}
            variant="primary"
            size="sm"
            label={t('meetings.add')}
            onClick={onCreateClick}
          />
        </div>
      </div>

      <div className="ml-auto hidden flex-wrap items-center gap-2 sm:flex">
        <Select value={view} onChange={(v) => onViewChange(v as CalendarView)} options={viewOptions} />
        <Select value={scope} onChange={(v) => onScopeChange(v as CalendarScope)} options={scopeOptions} />
        {scope === 'team' && canFilterTeam ? (
          <Select
            value={teamMemberId}
            onChange={onTeamMemberChange}
            options={owners.map((o) => ({ value: o.id, label: o.displayName }))}
          />
        ) : null}
        <Button onClick={onCreateClick}>
          <Plus size={16} className="mr-1.5" aria-hidden />
          {t('meetings.add')}
        </Button>
      </div>
    </div>
  )
}
