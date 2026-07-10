import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUserLike {
  id: string
  email?: string | null
  user_metadata?: { display_name?: string }
}

export type ThemeMode = 'light' | 'dark' | 'system'

export type AvatarType = 'photo' | 'emoji' | 'initials' | 'icon'

export interface UserProfile {
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
  avatarType: AvatarType
  avatarEmoji: string | null
  avatarIcon: string | null
  avatarBg: string | null
  language: 'en' | 'de' | 'ru'
  timezone: string
}

export type Role = 'founder' | 'ops' | 'sales_de' | 'sales_uk' | 'admin' | null
export type Territory = 'DE' | 'UK' | null

const EMPTY_USER: UserProfile = {
  id: '',
  email: '',
  displayName: '',
  avatarUrl: null,
  avatarType: 'initials',
  avatarEmoji: null,
  avatarIcon: null,
  avatarBg: null,
  language: 'de',
  timezone: 'Europe/Berlin',
}

export interface MeResponse {
  user: UserProfile
  role: Role
  territory: Territory
}

type ProfilePatch = Partial<
  Pick<
    UserProfile,
    | 'displayName'
    | 'avatarUrl'
    | 'avatarType'
    | 'avatarEmoji'
    | 'avatarIcon'
    | 'avatarBg'
    | 'language'
    | 'timezone'
  >
>

interface UserState {
  user: UserProfile
  role: Role
  territory: Territory
  sidebarCollapsed: boolean
  themeMode: ThemeMode
  profileLoaded: boolean

  loadProfile: (authUser: AuthUserLike) => Promise<void>
  clearProfile: () => void
  updateProfile: (patch: ProfilePatch) => Promise<void>
  setUserFromServer: (data: MeResponse) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setThemeMode: (mode: ThemeMode) => void
}

function toApiPatchKeys(patch: ProfilePatch): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (patch.displayName !== undefined) out.displayName = patch.displayName
  if (patch.avatarUrl !== undefined) out.avatarUrl = patch.avatarUrl
  if (patch.avatarType !== undefined) out.avatarType = patch.avatarType
  if (patch.avatarEmoji !== undefined) out.avatarEmoji = patch.avatarEmoji
  if (patch.avatarIcon !== undefined) out.avatarIcon = patch.avatarIcon
  if (patch.avatarBg !== undefined) out.avatarBg = patch.avatarBg
  if (patch.language !== undefined) out.language = patch.language
  if (patch.timezone !== undefined) out.timezone = patch.timezone
  return out
}

/** Serialize profile PATCH calls — parallel updates caused race rollbacks and 500s. */
let profileUpdateQueue: Promise<void> = Promise.resolve()

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: EMPTY_USER,
      role: null,
      territory: null,
      sidebarCollapsed: false,
      themeMode: 'system',
      profileLoaded: false,

      loadProfile: async (authUser) => {
        const fallback = (): void => {
          set({
            user: {
              ...EMPTY_USER,
              id: authUser.id,
              email: authUser.email ?? '',
              displayName:
                authUser.user_metadata?.display_name ||
                authUser.email?.split('@')[0] ||
                '',
            },
            role: null,
            territory: null,
            profileLoaded: true,
          })
        }

        const controller = new AbortController()
        const timer = window.setTimeout(() => controller.abort(), 12_000)

        try {
          const res = await fetch('/api/me', {
            credentials: 'include',
            signal: controller.signal,
          })
          window.clearTimeout(timer)
          if (!res.ok) {
            fallback()
            return
          }

          const data = (await res.json()) as MeResponse
          set({
            user: data.user,
            role: data.role,
            territory: data.territory,
            profileLoaded: true,
          })
        } catch {
          window.clearTimeout(timer)
          fallback()
        }
      },

      clearProfile: () =>
        set({
          user: EMPTY_USER,
          role: null,
          territory: null,
          profileLoaded: false,
        }),

      updateProfile: (patch) => {
        const task = profileUpdateQueue.then(async () => {
          const snapshot = get().user
          set({ user: { ...snapshot, ...patch } })

          try {
            const res = await fetch('/api/me', {
              method: 'PATCH',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(toApiPatchKeys(patch)),
            })

            if (!res.ok) {
              set({ user: snapshot })
              throw new Error('profile_update_failed')
            }

            const data = (await res.json()) as MeResponse
            set({ user: data.user, role: data.role, territory: data.territory })
          } catch (err) {
            set({ user: snapshot })
            throw err instanceof Error ? err : new Error('profile_update_failed')
          }
        })

        profileUpdateQueue = task.catch(() => {})
        return task
      },

      setUserFromServer: (data) =>
        set({ user: data.user, role: data.role, territory: data.territory }),

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setThemeMode: (mode) => set({ themeMode: mode }),
    }),
    {
      name: '2mb-crm-user',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        themeMode: state.themeMode,
      }),
    },
  ),
)
