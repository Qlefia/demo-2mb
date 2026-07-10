'use client'

import { useAuth } from '@/providers/AuthProvider'
import { PageLoadingCenter } from '@/components/atoms'
import { useUserStore } from '@/stores/userStore'
import { HomeDashboard } from '@/views/HomeDashboard'

export default function DashboardRoute() {
  const { isLoading } = useAuth()
  const profileLoaded = useUserStore((s) => s.profileLoaded)

  if (isLoading || !profileLoaded) {
    return <PageLoadingCenter />
  }

  return <HomeDashboard />
}
