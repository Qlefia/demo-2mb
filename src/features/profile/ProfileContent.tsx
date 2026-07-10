'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'
import { ProfileForm } from '@/features/settings/ProfileForm'
import { SecuritySettings } from '@/features/settings/SecuritySettings'
import { ActiveSessions } from '@/features/settings/ActiveSessions'
import { DataPrivacySettings } from '@/features/settings/DataPrivacySettings'
import { StudioSettingsMainPane } from '@/features/studio-settings/components/StudioSettingsMainPane'
import { studioSettingsShellRow } from '@/features/studio-settings/studioBlockChrome'
import { ProfileTabNav } from '@/features/profile/ProfileTabNav'
import { profileTabFromPath } from '@/lib/profile/profilePaths'

export function ProfileContent() {
  const pathname = usePathname()
  const tab = profileTabFromPath(pathname)

  let body: ReactNode
  if (tab === 'security') {
    body = <SecuritySettings />
  } else if (tab === 'sessions') {
    body = <ActiveSessions />
  } else if (tab === 'data') {
    body = <DataPrivacySettings />
  } else {
    body = <ProfileForm />
  }

  return (
    <div className={cn(studioSettingsShellRow, 'min-h-0 flex-1')}>
      <ProfileTabNav compactShell />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <StudioSettingsMainPane variant="page">{body}</StudioSettingsMainPane>
      </div>
    </div>
  )
}
