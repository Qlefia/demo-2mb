'use client'

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { useUserStore } from '@/stores/userStore'

interface AuthContextValue {
  user: User | null
  session: Session | null
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  isLoading: true,
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const session = useAuthStore((s) => s.session)
  const isLoading = useAuthStore((s) => s.isLoading)
  const setSession = useAuthStore((s) => s.setSession)
  const profileLoadedRef = useRef<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let active = true

    void supabase.auth.getSession().then(({ data }) => {
      if (active) setSession(data.session)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      setSession(nextSession)
    })

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [setSession])

  useEffect(() => {
    if (isLoading) return

    if (!user) {
      if (profileLoadedRef.current) {
        useUserStore.getState().clearProfile()
        profileLoadedRef.current = null
      }
      return
    }

    if (profileLoadedRef.current === user.id) return

    profileLoadedRef.current = user.id
    // Fire workspace provision in the background — it's idempotent
    // (onlyIfNoWorkspace) and historically slow on cold pools. Blocking the
    // dashboard render on it (as the previous awaited version did) made the
    // DashboardSkeleton pin for minutes whenever provision lagged.
    void fetch('/api/workspace/provision', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studioName: 'My studio', onlyIfNoWorkspace: true }),
    }).catch(() => {
      // Non-fatal: first workspace is created on /register when applicable.
    })
    void useUserStore.getState().loadProfile({
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata as { display_name?: string } | undefined,
    })
  }, [user, isLoading])

  return (
    <AuthContext.Provider value={{ user, session, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}
