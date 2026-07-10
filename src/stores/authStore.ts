import type { Session, User } from '@supabase/supabase-js'
import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import { POST_AUTH_STUDIO_PATH } from '@/lib/featureFlags'
import { useUserStore } from '@/stores/userStore'
import { useProspectStore } from '@/stores/prospectStore'
import { useNotificationStore } from '@/stores/notificationStore'

const PERSIST_KEYS_TO_CLEAR = [
  '2mb-crm-user',
  '2mb-crm-prospects-ui',
  '2mb-studio-profile',
] as const

function clearLocalUserData() {
  if (typeof window === 'undefined') return
  for (const key of PERSIST_KEYS_TO_CLEAR) window.localStorage.removeItem(key)
  useUserStore.getState().clearProfile()
  useProspectStore.setState({ selectedProspectId: null })
  useNotificationStore.setState({ notifications: [], loaded: false, loadedUserId: null })
}

type AuthStatus = 'idle' | 'loading' | 'error'

interface AuthState {
  status: AuthStatus
  error: string | null
  pendingEmail: string | null
  user: User | null
  session: Session | null
  isLoading: boolean

  setSession: (session: Session | null) => void
  setLoading: (isLoading: boolean) => void

  signUp: (args: {
    email: string
    password: string
    displayName?: string
    studioName: string
  }) => Promise<{ ok: boolean; needsEmailConfirmation?: boolean }>
  signIn: (email: string, password: string) => Promise<boolean>
  forgotPassword: (email: string) => Promise<boolean>
  resetPassword: (password: string) => Promise<boolean>
  signOut: () => Promise<void>

  clearError: () => void
  setPendingEmail: (email: string | null) => void
}

function mapAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login') || m.includes('invalid_credentials')) return 'auth.errors.invalidCredentials'
  if (m.includes('email not confirmed')) return 'auth.errors.emailNotConfirmed'
  if (m.includes('user already registered') || m.includes('already exists')) return 'auth.errors.userExists'
  if (m.includes('rate limit')) return 'auth.errors.rateLimited'
  if (m.includes('network')) return 'auth.errors.network'
  return 'auth.errors.unknown'
}

export const useAuthStore = create<AuthState>()((set) => ({
  status: 'idle',
  error: null,
  pendingEmail: null,
  user: null,
  session: null,
  isLoading: true,

  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      isLoading: false,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  signUp: async ({ email, password, displayName, studioName }) => {
    set({ status: 'loading', error: null })
    const supabase = createClient()
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          studio_name: studioName,
        },
        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(POST_AUTH_STUDIO_PATH)}`,
      },
    })
    if (error) {
      set({ status: 'error', error: mapAuthError(error.message) })
      return { ok: false }
    }
    if (!data.user) {
      set({ status: 'error', error: 'auth.errors.unknown' })
      return { ok: false }
    }
    if (!data.session) {
      set({ status: 'idle', error: null, isLoading: false })
      return { ok: true, needsEmailConfirmation: true }
    }
    set({
      status: 'idle',
      error: null,
      session: data.session,
      user: data.user,
      isLoading: false,
    })
    return { ok: true, needsEmailConfirmation: false }
  },

  signIn: async (email, password) => {
    set({ status: 'loading', error: null })
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      set({ status: 'error', error: mapAuthError(error.message) })
      return false
    }
    set({
      status: 'idle',
      error: null,
      session: data.session,
      user: data.user,
      isLoading: false,
    })
    return true
  },

  forgotPassword: async (email) => {
    set({ status: 'loading', error: null, pendingEmail: email })
    const supabase = createClient()
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
    })
    if (error) {
      set({ status: 'error', error: mapAuthError(error.message) })
      return false
    }
    set({ status: 'idle', error: null })
    return true
  },

  resetPassword: async (password) => {
    set({ status: 'loading', error: null })
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      set({ status: 'error', error: mapAuthError(error.message) })
      return false
    }
    set({ status: 'idle', error: null })
    return true
  },

  signOut: async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    clearLocalUserData()
    set({
      status: 'idle',
      error: null,
      pendingEmail: null,
      user: null,
      session: null,
      isLoading: false,
    })
  },

  clearError: () => set({ error: null }),
  setPendingEmail: (email) => set({ pendingEmail: email }),
}))
