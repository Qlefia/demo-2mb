import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AcceptInvitePage } from '@/features/auth/AcceptInvitePage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function AcceptInviteRoute() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?error=invite_session_missing')
  }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const initialDisplayName =
    typeof meta.display_name === 'string' && meta.display_name.trim().length > 0
      ? meta.display_name.trim()
      : (user.email ?? '').split('@')[0] || ''

  return (
    <AcceptInvitePage
      initialEmail={user.email ?? ''}
      initialDisplayName={initialDisplayName}
    />
  )
}
