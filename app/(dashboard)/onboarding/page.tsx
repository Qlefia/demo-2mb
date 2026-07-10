import { redirect } from 'next/navigation'
import { STUDIO_ONBOARDING_UI_ENABLED } from '@/lib/featureFlags'
import { WorkspaceOnboardingPageClient } from '@/features/workspace/WorkspaceOnboardingPageClient'

export default function OnboardingPage() {
  if (!STUDIO_ONBOARDING_UI_ENABLED) {
    redirect('/settings/studio')
  }
  return <WorkspaceOnboardingPageClient />
}
