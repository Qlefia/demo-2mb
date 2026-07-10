import { create } from 'zustand'
import { appFetch } from '@/lib/http/appFetch'
import { useUserStore } from '@/stores/userStore'

export type NotificationType =
  | 'new_response'
  | 'survey_published'
  | 'trial_ending'
  | 'lead_captured'
  | 'response_limit_reached'
  | 'survey_expired'
  | 'lead_assigned'

export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  message?: string
  surveyId?: string
  leadId?: string
  read: boolean
  createdAt: string
}

interface NotificationState {
  notifications: NotificationItem[]
  loaded: boolean
  loadedUserId: string | null
  unreadCount: () => number
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  addNotification: (notification: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>) => void
  getNotificationsForSurvey: (surveyId: string) => NotificationItem[]
  loadFromDb: (userId: string) => Promise<void>
}

export const useNotificationStore = create<NotificationState>()(
  (set, get) => ({
    notifications: [],
    loaded: false,
    loadedUserId: null,

    unreadCount: () => get().notifications.filter((n) => !n.read).length,

    markAsRead: async (id) => {
      const prev = get().notifications.find((n) => n.id === id)
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n,
        ),
      }))
      const userId = useUserStore.getState().user.id
      if (!userId) {
        if (prev) set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? prev : n)) }))
        return
      }
      const res = await appFetch('/api/notifications/read', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      })
      if (!res.ok && prev) {
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? prev : n)),
        }))
      }
    },

    markAllAsRead: async () => {
      const prev = get().notifications
      const ids = prev.filter((n) => !n.read).map((n) => n.id)
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      }))
      if (ids.length === 0) return
      const userId = useUserStore.getState().user.id
      if (!userId) {
        set({ notifications: prev })
        return
      }
      const res = await appFetch('/api/notifications/read', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      if (!res.ok) {
        set({ notifications: prev })
      }
    },

    addNotification: (notification) =>
      set((state) => ({
        notifications: [
          {
            ...notification,
            id: crypto.randomUUID(),
            read: false,
            createdAt: new Date().toISOString(),
          },
          ...state.notifications,
        ],
      })),

    getNotificationsForSurvey: (surveyId) =>
      get().notifications.filter((n) => n.surveyId === surveyId),

    loadFromDb: async (userId) => {
      if (!userId) return
      if (get().loaded && get().loadedUserId === userId) return
      const res = await appFetch('/api/notifications', { credentials: 'include' })
      if (!res.ok) return
      const payload = (await res.json()) as {
        items: Array<{
          id: string
          type: string
          title: string
          message: string
          survey_id: string | null
          lead_id: string | null
          is_read: boolean
          created_at: string
        }>
      }

      if (useUserStore.getState().user.id !== userId) return

      const mapped: NotificationItem[] = (payload.items ?? []).map((row) => ({
        id: row.id,
        type: row.type as NotificationType,
        title: row.title,
        message: row.message || undefined,
        surveyId: row.survey_id ?? undefined,
        leadId: row.lead_id ?? undefined,
        read: row.is_read ?? false,
        createdAt: row.created_at,
      }))

      set({ notifications: mapped, loaded: true, loadedUserId: userId })
    },
  }),
)
