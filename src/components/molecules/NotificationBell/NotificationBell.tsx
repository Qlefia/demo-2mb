'use client'

import { Fragment, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Bell, MessageSquare, Globe, Clock, UserPlus, AlertTriangle, CalendarX } from 'lucide-react'
import { Popover, PopoverButton, PopoverPanel, Transition } from '@headlessui/react'
import { cn } from '@/lib/cn'
import {
  useNotificationStore,
  type NotificationItem,
  type NotificationType,
} from '@/stores/notificationStore'
import { useUserStore } from '@/stores/userStore'

const TYPE_ICONS: Record<NotificationType, typeof Bell> = {
  new_response: MessageSquare,
  survey_published: Globe,
  trial_ending: Clock,
  lead_captured: UserPlus,
  response_limit_reached: AlertTriangle,
  survey_expired: CalendarX,
  lead_assigned: UserPlus,
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function NotificationBell() {
  const { t } = useTranslation()
  const router = useRouter()
  const notifications = useNotificationStore((s) => s.notifications)
  const unreadCount = useNotificationStore((s) => s.unreadCount())
  const markAsRead = useNotificationStore((s) => s.markAsRead)
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead)
  const loadFromDb = useNotificationStore((s) => s.loadFromDb)
  const userId = useUserStore((s) => s.user.id)

  useEffect(() => {
    if (userId) loadFromDb(userId)
  }, [userId, loadFromDb])

  const handleClick = (notif: NotificationItem) => {
    void markAsRead(notif.id)
    // CRM has only one entry point for now — every notification opens the
    // prospects pipeline. The richer routing (per-prospect deeplinks) is
    // wired when the notifications backend lands.
    router.push('/prospects')
  }

  return (
    <Popover className="relative">
      <PopoverButton
        className={cn(
          'relative flex h-8 w-8 items-center justify-center rounded-sm text-muted outline-none transition-colors',
          'max-lg:h-10 max-lg:w-10',
          'hover:bg-primary/5 hover:text-foreground',
          'focus:outline-none focus-visible:outline-none',
        )}
        aria-label={unreadCount > 0 ? t('aria.notifications', { count: unreadCount }) : t('aria.notificationsNone')}
      >
        <Bell size={18} className="max-lg:size-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </PopoverButton>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <PopoverPanel className="absolute right-0 z-50 mt-2 w-80 origin-top-right rounded-sm border border-border bg-background focus:outline-none">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <h3 className="text-sm font-medium">{t('notifications.title')}</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllAsRead()}
                className="text-xs text-muted hover:text-foreground"
              >
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell size={24} className="mx-auto mb-2 text-muted" />
                <p className="text-sm text-muted">{t('notifications.empty')}</p>
                <p className="text-xs text-muted">{t('notifications.emptyDesc')}</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {notifications.slice(0, 10).map((notif) => {
                  const Icon = TYPE_ICONS[notif.type]
                  return (
                    <li key={notif.id}>
                      <button
                        onClick={() => handleClick(notif)}
                        className={cn(
                          'flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-primary/5',
                          !notif.read && 'bg-primary/5',
                        )}
                      >
                        <Icon size={14} className="shrink-0 text-muted" />
                        <span className={cn('min-w-0 flex-1 truncate text-sm', !notif.read && 'font-medium')}>
                          {notif.title}
                        </span>
                        <span className="shrink-0 text-[10px] text-muted">{timeAgo(notif.createdAt)}</span>
                        {!notif.read && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </PopoverPanel>
      </Transition>
    </Popover>
  )
}
