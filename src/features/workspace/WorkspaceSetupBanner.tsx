'use client'

import { STUDIO_ONBOARDING_UI_ENABLED } from '@/lib/featureFlags'
import { WorkspaceSetupBannerInner } from '@/features/workspace/WorkspaceSetupBannerInner'

export function WorkspaceSetupBanner() {
  if (!STUDIO_ONBOARDING_UI_ENABLED) return null
  return <WorkspaceSetupBannerInner />
}
