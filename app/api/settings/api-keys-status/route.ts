import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAuthorizedUser, requireRole } from '@/lib/auth/roles'
import { getWorkspaceApiKeysConfigured } from '@/lib/config/workspaceApiKeys.server'
import { getCommsProvidersStatus } from '@/lib/config/workspaceComms.server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Returns which provider keys are set on the server process (env).
 * Never exposes secret values — booleans only.
 */
export async function GET() {
  const supabase = await createClient()
  const auth = await requireRole(supabase, ['founder', 'ops', 'admin'])
  if (!isAuthorizedUser(auth)) {
    return auth
  }

  const keys = getWorkspaceApiKeysConfigured()
  const comms = getCommsProvidersStatus()
  return NextResponse.json({
    keys,
    comms,
    source: 'server_environment' as const,
  })
}
